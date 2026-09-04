import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { TaskService } from './task-service';
import { Task, TaskStatus } from './task.types';

const seedTasks: Task[] = [
  {
    id: 1,
    title: 'Design authentication flow',
    description: '<p>Design the login flow.</p>',
    deadline: '2099-01-15',
    status: TaskStatus.COMPLETED,
  },
  {
    id: 2,
    title: 'Implement task list',
    description: '<p>Build the task list page.</p>',
    deadline: '2099-02-20',
    status: TaskStatus.IN_PROGRESS,
  },
];

describe('TaskService', () => {
  let service: TaskService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(TaskService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  /** Seeds the in-memory store by resolving the one-time JSON fetch. */
  function seedStore(): void {
    service.getTasks().subscribe();
    httpTesting.expectOne('assets/tasks.json').flush(structuredClone(seedTasks));
  }

  it('fetches the seed data only once', () => {
    seedStore();

    let secondResult: Task[] | undefined;
    service.getTasks().subscribe((tasks) => (secondResult = tasks));

    httpTesting.expectNone('assets/tasks.json');
    expect(secondResult?.length).toBe(2);
  });

  it('assigns the next id when creating and keeps the task in the store', () => {
    seedStore();

    let created: Task | undefined;
    service
      .createTask({
        title: 'Write the form',
        description: '<p>With Quill.</p>',
        deadline: '2099-03-01',
        status: TaskStatus.PENDING,
      })
      .subscribe((task) => (created = task));

    expect(created?.id).toBe(3);

    let tasks: Task[] | undefined;
    service.getTasks().subscribe((result) => (tasks = result));
    expect(tasks?.length).toBe(3);
    expect(tasks?.at(-1)?.title).toBe('Write the form');
  });

  it('seeds the store on demand when creating without a prior read', () => {
    let created: Task | undefined;
    service
      .createTask({
        title: 'Deep-linked create',
        description: '<p>No list visit first.</p>',
        deadline: '2099-03-01',
        status: TaskStatus.PENDING,
      })
      .subscribe((task) => (created = task));

    httpTesting.expectOne('assets/tasks.json').flush(structuredClone(seedTasks));

    expect(created?.id).toBe(3);
  });

  it('replaces the task in place on update', () => {
    seedStore();

    service
      .updateTask(1, {
        title: 'Renamed',
        description: '<p>Changed.</p>',
        deadline: '2099-01-15',
        status: TaskStatus.PENDING,
      })
      .subscribe();

    let tasks: Task[] | undefined;
    service.getTasks().subscribe((result) => (tasks = result));

    expect(tasks?.[0]).toEqual({
      id: 1,
      title: 'Renamed',
      description: '<p>Changed.</p>',
      deadline: '2099-01-15',
      status: TaskStatus.PENDING,
    });
    expect(tasks?.length).toBe(2);
  });

  it('errors when updating a task that no longer exists', () => {
    seedStore();

    let caught: unknown;
    service
      .updateTask(99, {
        title: 'Ghost',
        description: '<p>Gone.</p>',
        deadline: '2099-01-15',
        status: TaskStatus.PENDING,
      })
      .subscribe({ error: (error: unknown) => (caught = error) });

    expect(caught).toBeInstanceOf(Error);
  });

  it('removes a deleted task for good', () => {
    seedStore();

    service.deleteTask(1).subscribe();

    let tasks: Task[] | undefined;
    service.getTasks().subscribe((result) => (tasks = result));

    expect(tasks?.map((task) => task.id)).toEqual([2]);
  });

  it('finds a single task by id from the store', () => {
    seedStore();

    let found: Task | undefined;
    service.getTaskById(2).subscribe((task) => (found = task));

    expect(found?.title).toBe('Implement task list');
  });
});
