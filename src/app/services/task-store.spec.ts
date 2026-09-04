import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { TaskStore } from './task-store';
import { CommentRow, TaskComment } from './comment.types';
import { Task, TaskRow, TaskStatus, TaskWithComments } from './task.types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const seedTasks: TaskRow[] = [
  {
    id: '1',
    title: 'Design authentication flow',
    description: '<p>Design the login flow.</p>',
    deadline: '2099-01-15',
    status: TaskStatus.COMPLETED,
  },
  {
    id: '2',
    title: 'Implement task list',
    description: '<p>Build the task list page.</p>',
    deadline: '2099-02-20',
    status: TaskStatus.IN_PROGRESS,
  },
];

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

describe('TaskStore', () => {
  let store: TaskStore;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    store = TestBed.inject(TaskStore);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  /** Seeds the in-memory task store by resolving the one-time JSON fetch. */
  function seedTaskStore(): void {
    store.getTasks().subscribe();
    httpTesting.expectOne('assets/tasks.json').flush(structuredClone(seedTasks));
  }

  /** Same, for comments. They seed independently of tasks. */
  function seedCommentStore(): void {
    store.getComments('1').subscribe();
    httpTesting.expectOne('assets/comments.json').flush(structuredClone(seedComments));
  }

  it('fetches the seed data only once', () => {
    seedTaskStore();

    let secondResult: Task[] | undefined;
    store.getTasks().subscribe((tasks) => (secondResult = tasks));

    httpTesting.expectNone('assets/tasks.json');
    expect(secondResult?.length).toBe(2);
  });

  it('assigns a uuid when creating and keeps the task in the store', () => {
    seedTaskStore();

    let created: Task | undefined;
    store
      .createTask({
        title: 'Write the form',
        description: '<p>With Quill.</p>',
        deadline: '2099-03-01',
        status: TaskStatus.PENDING,
      })
      .subscribe((task) => (created = task));

    expect(created?.id).toMatch(UUID_PATTERN);

    let tasks: Task[] | undefined;
    store.getTasks().subscribe((result) => (tasks = result));
    expect(tasks?.length).toBe(3);
    expect(tasks?.at(-1)?.title).toBe('Write the form');
  });

  it('seeds the store on demand when creating without a prior read', () => {
    let created: Task | undefined;
    store
      .createTask({
        title: 'Deep-linked create',
        description: '<p>No list visit first.</p>',
        deadline: '2099-03-01',
        status: TaskStatus.PENDING,
      })
      .subscribe((task) => (created = task));

    httpTesting.expectOne('assets/tasks.json').flush(structuredClone(seedTasks));

    expect(created?.id).toMatch(UUID_PATTERN);
  });

  it('replaces the task in place on update', () => {
    seedTaskStore();

    store
      .updateTask('1', {
        title: 'Renamed',
        description: '<p>Changed.</p>',
        deadline: '2099-01-15',
        status: TaskStatus.PENDING,
      })
      .subscribe();

    let tasks: Task[] | undefined;
    store.getTasks().subscribe((result) => (tasks = result));

    expect(tasks?.[0]).toEqual({
      id: '1',
      title: 'Renamed',
      description: '<p>Changed.</p>',
      deadline: '2099-01-15',
      status: TaskStatus.PENDING,
    });
    expect(tasks?.length).toBe(2);
  });

  it('errors when updating a task that no longer exists', () => {
    seedTaskStore();

    let caught: unknown;
    store
      .updateTask('99', {
        title: 'Ghost',
        description: '<p>Gone.</p>',
        deadline: '2099-01-15',
        status: TaskStatus.PENDING,
      })
      .subscribe({ error: (error: unknown) => (caught = error) });

    expect(caught).toBeInstanceOf(Error);
  });

  it('removes a deleted task for good', () => {
    seedTaskStore();

    store.deleteTask('1').subscribe();

    let tasks: Task[] | undefined;
    store.getTasks().subscribe((result) => (tasks = result));

    expect(tasks?.map((task) => task.id)).toEqual(['2']);
  });

  it('finds a single task by id from the store', () => {
    seedTaskStore();

    let found: Task | undefined;
    store.getTaskById('2').subscribe((task) => (found = task));

    expect(found?.title).toBe('Implement task list');
  });

  describe('comments', () => {
    it('maps the stored columns onto the app model', () => {
      let comments: TaskComment[] | undefined;
      store.getComments('1').subscribe((result) => (comments = result));
      httpTesting.expectOne('assets/comments.json').flush(structuredClone(seedComments));

      expect(comments?.[1]).toEqual({
        id: '2',
        taskId: '1',
        parentCommentId: '1',
        text: 'Agreed.',
        createdAt: '2099-01-01T10:00:00.000Z',
      });
    });

    it('fetches the seed data only once and filters by task', () => {
      seedCommentStore();

      let comments: TaskComment[] | undefined;
      store.getComments('2').subscribe((result) => (comments = result));

      httpTesting.expectNone('assets/comments.json');
      expect(comments?.map((comment) => comment.id)).toEqual(['3']);
    });

    it('returns an empty thread for a task nobody has commented on', () => {
      seedCommentStore();

      let comments: TaskComment[] | undefined;
      store.getComments('99').subscribe((result) => (comments = result));

      expect(comments).toEqual([]);
    });

    it('assigns a uuid and a timestamp when adding', () => {
      seedCommentStore();

      let created: TaskComment | undefined;
      store
        .addComment({ taskId: '2', parentCommentId: null, text: 'Looks good.' })
        .subscribe((comment) => (created = comment));

      expect(created?.id).toMatch(UUID_PATTERN);
      expect(created?.createdAt).toBeTruthy();

      let comments: TaskComment[] | undefined;
      store.getComments('2').subscribe((result) => (comments = result));
      expect(comments?.map((comment) => comment.text)).toEqual(['Rows are in.', 'Looks good.']);
    });

    it('seeds on demand when adding without a prior read', () => {
      let created: TaskComment | undefined;
      store
        .addComment({ taskId: '1', parentCommentId: null, text: 'Deep-linked.' })
        .subscribe((comment) => (created = comment));

      httpTesting.expectOne('assets/comments.json').flush(structuredClone(seedComments));

      expect(created?.id).toMatch(UUID_PATTERN);
    });

    it('persists the parent when adding a reply', () => {
      seedCommentStore();

      let created: TaskComment | undefined;
      store
        .addComment({ taskId: '1', parentCommentId: '2', text: 'Nested.' })
        .subscribe((comment) => (created = comment));

      expect(created?.parentCommentId).toBe('2');

      let comments: TaskComment[] | undefined;
      store.getComments('1').subscribe((result) => (comments = result));
      expect(comments?.find((comment) => comment.text === 'Nested.')?.parentCommentId).toBe('2');
    });

    it('answers a task and its thread from one read when comments are requested', () => {
      let result: TaskWithComments | undefined;
      store.getTaskById('1', { comments: true }).subscribe((task) => (result = task));

      httpTesting.expectOne('assets/tasks.json').flush(structuredClone(seedTasks));
      httpTesting.expectOne('assets/comments.json').flush(structuredClone(seedComments));

      expect(result?.title).toBe('Design authentication flow');
      expect(result?.comments.map((comment) => comment.id)).toEqual(['1', '2']);
    });

    it('serves a second combined read entirely from the store', () => {
      seedTaskStore();
      seedCommentStore();

      let result: TaskWithComments | undefined;
      store.getTaskById('2', { comments: true }).subscribe((task) => (result = task));

      httpTesting.expectNone('assets/tasks.json');
      httpTesting.expectNone('assets/comments.json');
      expect(result?.comments.map((comment) => comment.id)).toEqual(['3']);
    });

    it('skips the comment read when the task does not exist', () => {
      seedTaskStore();

      let result: TaskWithComments | undefined | 'unset' = 'unset';
      store.getTaskById('99', { comments: true }).subscribe((task) => (result = task));

      httpTesting.expectNone('assets/comments.json');
      expect(result).toBeUndefined();
    });

    it('drops the comments of a deleted task', () => {
      seedTaskStore();
      seedCommentStore();

      store.deleteTask('1').subscribe();

      let comments: TaskComment[] | undefined;
      store.getComments('1').subscribe((result) => (comments = result));

      expect(comments).toEqual([]);
    });
  });
});
