import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CommentStore } from './comment-store';
import { TaskStore } from './task-store';
import { CommentRow } from './comment.types';
import { TaskRow, TaskStatus } from './task.types';

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
    task_id: '2',
    parent_comment_id: null,
    text: 'Rows are in.',
    created_at: '2099-01-02T09:00:00.000Z',
  },
];

describe('TaskStore', () => {
  let store: TaskStore;
  let commentStore: CommentStore;
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
    commentStore = TestBed.inject(CommentStore);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  /**
   * Seeds the store by starting the load and answering its one fetch.
   *
   * The load is awaited afterwards rather than before, because `flush` is what
   * resolves it — awaiting first would deadlock.
   */
  async function seedTaskStore(): Promise<void> {
    const loading = store.loadTasks();
    httpTesting.expectOne('assets/tasks.json').flush(structuredClone(seedTasks));
    await loading;
  }

  async function seedCommentStore(): Promise<void> {
    const loading = commentStore.loadComments();
    httpTesting.expectOne('assets/comments.json').flush(structuredClone(seedComments));
    await loading;
  }

  it('fetches the seed data only once', async () => {
    await seedTaskStore();

    await store.loadTasks();

    httpTesting.expectNone('assets/tasks.json');
    expect(store.tasks.length).toBe(2);
  });

  it('reports a failed load and recovers on retry', async () => {
    const loading = store.loadTasks();
    httpTesting.expectOne('assets/tasks.json').error(new ProgressEvent('failed'));
    await loading;

    expect(store.loadError).toBeTruthy();
    expect(store.hasLoaded).toBe(false);

    const retrying = store.reloadTasks();
    httpTesting.expectOne('assets/tasks.json').flush(structuredClone(seedTasks));
    await retrying;

    expect(store.loadError).toBeNull();
    expect(store.tasks.length).toBe(2);
  });

  it('keeps hasLoaded latched while a reload is in flight', async () => {
    await seedTaskStore();

    const reloading = store.reloadTasks();

    expect(store.isLoading).toBe(true);
    expect(store.hasLoaded).toBe(true);

    httpTesting.expectOne('assets/tasks.json').flush(structuredClone(seedTasks));
    await reloading;
  });

  it('assigns a uuid when creating and keeps the task in the store', async () => {
    await seedTaskStore();

    const created = await store.createTask({
      title: 'Write the form',
      description: '<p>With Quill.</p>',
      deadline: '2099-03-01',
      status: TaskStatus.PENDING,
    });

    expect(created?.id).toMatch(UUID_PATTERN);
    expect(store.tasks.length).toBe(3);
    expect(store.tasks.at(-1)?.title).toBe('Write the form');
  });

  it('seeds the store on demand when creating without a prior read', async () => {
    const creating = store.createTask({
      title: 'Deep-linked create',
      description: '<p>No list visit first.</p>',
      deadline: '2099-03-01',
      status: TaskStatus.PENDING,
    });

    httpTesting.expectOne('assets/tasks.json').flush(structuredClone(seedTasks));

    expect((await creating)?.id).toMatch(UUID_PATTERN);
  });

  it('replaces the task in place on update', async () => {
    await seedTaskStore();

    await store.updateTask('1', {
      title: 'Renamed',
      description: '<p>Changed.</p>',
      deadline: '2099-01-15',
      status: TaskStatus.PENDING,
    });

    expect(store.tasks[0]).toEqual({
      id: '1',
      title: 'Renamed',
      description: '<p>Changed.</p>',
      deadline: '2099-01-15',
      status: TaskStatus.PENDING,
    });
    expect(store.tasks.length).toBe(2);
  });

  it('reports a failure when updating a task that no longer exists', async () => {
    await seedTaskStore();

    const updated = await store.updateTask('99', {
      title: 'Ghost',
      description: '<p>Gone.</p>',
      deadline: '2099-01-15',
      status: TaskStatus.PENDING,
    });

    expect(updated).toBeNull();
    expect(store.saveError).toBe('Task 99 no longer exists.');
  });

  it('removes a deleted task for good', async () => {
    await seedTaskStore();

    await expect(store.deleteTask('1')).resolves.toBe(true);

    expect(store.tasks.map((task) => task.id)).toEqual(['2']);
  });

  it('drops the comments of a deleted task', async () => {
    await seedTaskStore();
    await seedCommentStore();

    await store.deleteTask('1');

    expect(commentStore.commentsFor('1')).toEqual([]);
    expect(commentStore.commentsFor('2').length).toBe(1);
  });

  it('finds a single task by id from the store', async () => {
    await seedTaskStore();

    expect(store.taskById('2')?.title).toBe('Implement task list');
    expect(store.taskById('99')).toBeUndefined();
  });

  describe('derived views', () => {
    it('marks a past deadline overdue unless the task is completed', async () => {
      const overdueRows: TaskRow[] = [
        { ...seedTasks[0], id: 'past-completed', deadline: '2000-01-01' },
        {
          ...seedTasks[1],
          id: 'past-in-progress',
          deadline: '2000-01-01',
          status: TaskStatus.IN_PROGRESS,
        },
      ];

      const loading = store.loadTasks();
      httpTesting.expectOne('assets/tasks.json').flush(overdueRows);
      await loading;

      expect(store.taskItems.map((task) => task.isOverdue)).toEqual([false, true]);
      expect(store.overdueCount).toBe(1);
    });

    it('counts the tasks by status', async () => {
      await seedTaskStore();

      expect(store.totalCount).toBe(2);
      expect(store.inProgressCount).toBe(1);
    });

    it('maps each task onto a linkable, labelled calendar event', async () => {
      await seedTaskStore();

      const [event] = store.calendarEvents;

      expect(event.id).toBe('1');
      expect(event.date).toBe('2099-01-15');
      // A real href is what keeps an event keyboard reachable.
      expect(event.url).toBe('/tasks/1');
      // Status reaches the label, so colour is never the only carrier of it.
      expect(event.ariaLabel).toContain('Completed');
    });
  });
});
