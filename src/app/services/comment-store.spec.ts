import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CommentStore } from './comment-store';
import { CommentRow } from './comment.types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Task 1 carries a two-level chain; task 2 has one lone comment. */
const seedComments: CommentRow[] = [
  {
    id: '1',
    task_id: '1',
    parent_comment_id: null,
    text: 'Needs a validation pass.',
    created_at: '2099-01-01T09:00:00.000Z',
  },
  {
    id: '2',
    task_id: '1',
    parent_comment_id: '1',
    text: 'Agreed.',
    created_at: '2099-01-01T10:00:00.000Z',
  },
  {
    id: '3',
    task_id: '2',
    parent_comment_id: null,
    text: 'Rows are in.',
    created_at: '2099-01-02T09:00:00.000Z',
  },
];

describe('CommentStore', () => {
  let store: CommentStore;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    store = TestBed.inject(CommentStore);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  /**
   * Seeds the store by starting the load and answering its one fetch. The load
   * is awaited afterwards, because `flush` is what resolves it.
   */
  async function seedCommentStore(): Promise<void> {
    const loading = store.loadComments();
    httpTesting.expectOne('assets/comments.json').flush(structuredClone(seedComments));
    await loading;
  }

  it('maps the stored columns onto the app model', async () => {
    await seedCommentStore();

    expect(store.comments[1]).toEqual({
      id: '2',
      taskId: '1',
      parentCommentId: '1',
      text: 'Agreed.',
      createdAt: '2099-01-01T10:00:00.000Z',
    });
  });

  it('fetches the seed data only once and filters by task', async () => {
    await seedCommentStore();

    await store.loadComments();

    httpTesting.expectNone('assets/comments.json');
    expect(store.commentsFor('2').map((comment) => comment.id)).toEqual(['3']);
  });

  it('returns an empty thread for a task nobody has commented on', async () => {
    await seedCommentStore();

    expect(store.commentsFor('99')).toEqual([]);
    expect(store.threadFor('99')).toEqual([]);
    expect(store.countFor('99')).toBe(0);
  });

  it('reports a failed load and recovers on retry', async () => {
    const loading = store.loadComments();
    httpTesting.expectOne('assets/comments.json').error(new ProgressEvent('failed'));
    await loading;

    expect(store.loadError).toBeTruthy();

    const retrying = store.reloadComments();
    httpTesting.expectOne('assets/comments.json').flush(structuredClone(seedComments));
    await retrying;

    expect(store.loadError).toBeNull();
    expect(store.comments.length).toBe(3);
  });

  it('assigns a uuid and a timestamp when adding', async () => {
    await seedCommentStore();

    const created = await store.addComment({
      taskId: '2',
      parentCommentId: null,
      text: 'Looks good.',
    });

    expect(created?.id).toMatch(UUID_PATTERN);
    expect(created?.createdAt).toBeTruthy();
    expect(store.commentsFor('2').map((comment) => comment.text)).toEqual([
      'Rows are in.',
      'Looks good.',
    ]);
  });

  it('seeds on demand when adding without a prior read', async () => {
    const adding = store.addComment({ taskId: '1', parentCommentId: null, text: 'Deep-linked.' });

    httpTesting.expectOne('assets/comments.json').flush(structuredClone(seedComments));

    expect((await adding)?.id).toMatch(UUID_PATTERN);
  });

  it('persists the parent when adding a reply', async () => {
    await seedCommentStore();

    const created = await store.addComment({ taskId: '1', parentCommentId: '2', text: 'Nested.' });

    expect(created?.parentCommentId).toBe('2');
    expect(
      store.commentsFor('1').find((comment) => comment.text === 'Nested.')?.parentCommentId,
    ).toBe('2');
  });

  it('nests a thread and leaves other tasks out of it', async () => {
    await seedCommentStore();

    const [root] = store.threadFor('1');

    expect(root.id).toBe('1');
    expect(root.depth).toBe(0);
    expect(root.replies.map((reply) => reply.id)).toEqual(['2']);
    expect(root.replies[0].depth).toBe(1);
    expect(store.countFor('1')).toBe(2);
  });

  it('drops every comment on a removed task', async () => {
    await seedCommentStore();

    store.removeForTask('1');

    expect(store.commentsFor('1')).toEqual([]);
    expect(store.comments.map((comment) => comment.id)).toEqual(['3']);
  });
});
