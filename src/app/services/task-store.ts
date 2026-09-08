import { Injectable, inject } from '@angular/core';
import { makeAutoObservable, observableRef, runInAction } from 'mobx';
import { firstValueFrom } from 'rxjs';

import { CalendarEvent } from '../components/common-calendar/common-calendar.types';
import { LoadState, SaveState } from '../state/load-state';
import { formatDateLabel, isBeforeToday } from '../utils/date.utils';
import { CommentStore } from './comment-store';
import { TaskRepo } from './task-repo';
import {
  TASK_STATUS_EVENT_COLORS,
  TASK_STATUS_LABELS,
  Task,
  TaskDraft,
  TaskListItem,
  TaskStatus,
} from './task.types';

const LOAD_ERROR_MESSAGE = "Couldn't load your tasks.";
const SAVE_ERROR_MESSAGE = "Couldn't save the task. Please try again.";
const DELETE_ERROR_MESSAGE = "Couldn't delete the task. Please try again.";

/**
 * Every task in the app, the state of reading and writing them, and the views
 * derived from them.
 *
 * `TaskRepo` fetches; this holds and derives. The collection is seeded once
 * from the static JSON behind the repo and then served from memory, because
 * there is no write endpoint to persist to — tasks created in a session live
 * here for its lifetime.
 *
 * Nothing outside this class may assign to its fields: `enforceActions` (see
 * `mobx.config.ts`) makes MobX throw if anything tries. Every change goes
 * through one of the methods below, which is what keeps the mutation logic in
 * one readable place instead of spread across the pages.
 *
 * Views read this through `mobxToSignal()` and re-render on their own. There is
 * deliberately no reload/refresh call for a component to forget.
 */
@Injectable({
  providedIn: 'root',
})
export class TaskStore {
  private readonly repo = inject(TaskRepo);

  // Injected for one reason only: deleting a task has to take its comments with
  // it. Tasks own that relationship, so the cascade belongs on this side.
  private readonly commentStore = inject(CommentStore);

  tasks: readonly Task[] = [];

  loadState = LoadState.IDLE;

  loadError: string | null = null;

  /**
   * True once tasks have arrived, and never false again — including while a
   * reload is in flight.
   *
   * `loadState` alone cannot answer "do we have something to show?", because a
   * reload puts it back to LOADING. Views use this to keep rendering the data
   * they already have instead of collapsing to a skeleton, which matters most
   * for the calendar: tearing it down would lose the view and month the user
   * had paged to.
   */
  hasLoaded = false;

  saveState = SaveState.IDLE;

  saveError: string | null = null;

  constructor() {
    // The second type argument names the private fields, which TypeScript
    // otherwise leaves out of the annotation map.
    makeAutoObservable<TaskStore, 'repo' | 'commentStore'>(
      this,
      {
        // Injected services are not state.
        repo: false,
        commentStore: false,
        // By reference: MobX tracks the array as a whole and leaves the tasks
        // inside it as plain objects. Every mutation below replaces the array
        // and replaces whole tasks rather than editing one in place, so
        // per-object tracking would cost proxies and buy nothing — and it keeps
        // plain objects flowing out to the templates.
        tasks: observableRef,
      },
      { autoBind: true },
    );
  }

  get isLoading(): boolean {
    return this.loadState === LoadState.LOADING;
  }

  get isSaving(): boolean {
    return this.saveState === SaveState.SAVING;
  }

  /** The list view's rows: every task, with the overdue rule already applied. */
  get taskItems(): TaskListItem[] {
    return this.tasks.map((task) => ({
      ...task,
      isOverdue: this.isOverdue(task),
    }));
  }

  get totalCount(): number {
    return this.tasks.length;
  }

  get inProgressCount(): number {
    return this.tasks.filter((task) => task.status === TaskStatus.IN_PROGRESS).length;
  }

  get overdueCount(): number {
    return this.taskItems.filter((task) => task.isOverdue).length;
  }

  /** The same tasks, placed on the calendar by deadline. */
  get calendarEvents(): CalendarEvent[] {
    return this.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      date: task.deadline,
      // A real destination, so the event renders as an `<a href>` and stays
      // reachable by keyboard and openable in a new tab.
      url: `/tasks/${task.id}`,
      colors: TASK_STATUS_EVENT_COLORS[task.status],
      // Status reaches the label so colour is never the only carrier of it.
      ariaLabel: `${task.title}, ${TASK_STATUS_LABELS[task.status]}, due ${formatDateLabel(task.deadline)}`,
    }));
  }

  /**
   * One task, or `undefined` if no task has that id.
   *
   * A plain method rather than a `computed`, because a MobX computed cannot
   * take an argument. It still re-runs correctly inside a reaction — it reads
   * `tasks`, so `mobxToSignal` tracks it — it simply isn't memoised across calls.
   * At this data size that is not worth a `computedFn` dependency.
   */
  taskById(id: string): Task | undefined {
    return this.tasks.find((task) => task.id === id);
  }

  /** Whether a task's deadline has passed. Completed work is never overdue. */
  isOverdue(task: Task): boolean {
    return task.status !== TaskStatus.COMPLETED && isBeforeToday(task.deadline);
  }

  /** Seeds the store on first use. Calling it again is free. */
  async loadTasks(): Promise<void> {
    if (this.hasLoaded || this.isLoading) {
      return;
    }

    await this.fetchTasks();
  }

  /** Forces a refetch — what a failed load's Retry button calls. */
  async reloadTasks(): Promise<void> {
    if (this.isLoading) {
      return;
    }

    await this.fetchTasks();
  }

  /**
   * Creates a task and returns it — or `null` if the save failed, so the caller
   * can tell the two apart without inspecting `saveError`.
   */
  async createTask(draft: TaskDraft): Promise<Task | null> {
    return this.save(() => {
      const created: Task = { ...draft, id: crypto.randomUUID() };

      runInAction(() => {
        this.tasks = [...this.tasks, created];
      });

      return created;
    });
  }

  /** Replaces a task in place. Returns `null` if the save failed. */
  async updateTask(id: string, draft: TaskDraft): Promise<Task | null> {
    return this.save(() => {
      const index = this.tasks.findIndex((task) => task.id === id);

      if (index === -1) {
        throw new Error(`Task ${id} no longer exists.`);
      }

      const updated: Task = { ...draft, id };
      const nextTasks = [...this.tasks];
      nextTasks[index] = updated;

      runInAction(() => {
        this.tasks = nextTasks;
      });

      return updated;
    });
  }

  /** Deletes a task and its comments. Returns whether it succeeded. */
  async deleteTask(id: string): Promise<boolean> {
    const deleted = await this.save(() => {
      runInAction(() => {
        this.tasks = this.tasks.filter((task) => task.id !== id);
      });

      // The comments referenced this task; leaving them behind would strand
      // rows against a foreign key that no longer resolves. A no-op when the
      // comment store has not been seeded — there is nothing there to strand.
      this.commentStore.removeForTask(id);

      return true;
    }, DELETE_ERROR_MESSAGE);

    return deleted === true;
  }

  /** Clears a failed save so the next attempt starts from a clean slate. */
  clearSaveError(): void {
    this.saveError = null;
    this.saveState = SaveState.IDLE;
  }

  /**
   * The shared shape of every write: seed the collection, run the change, and
   * record the outcome. Seeding first is what lets `tasks/create` and
   * `tasks/update/:id` be opened directly without visiting the list page.
   */
  private async save<T>(change: () => T, failureMessage = SAVE_ERROR_MESSAGE): Promise<T | null> {
    runInAction(() => {
      this.saveState = SaveState.SAVING;
      this.saveError = null;
    });

    await this.loadTasks();

    try {
      if (this.loadError !== null) {
        throw new Error(failureMessage);
      }

      const result = change();

      runInAction(() => {
        this.saveState = SaveState.SAVED;
      });

      return result;
    } catch (error: unknown) {
      runInAction(() => {
        this.saveState = SaveState.FAILED;
        this.saveError = error instanceof Error ? error.message : failureMessage;
      });

      return null;
    }
  }

  private async fetchTasks(): Promise<void> {
    runInAction(() => {
      this.loadState = LoadState.LOADING;
      this.loadError = null;
    });

    try {
      const tasks = await firstValueFrom(this.repo.fetchTasks());

      runInAction(() => {
        this.tasks = tasks;
        this.loadState = LoadState.LOADED;
        this.hasLoaded = true;
      });
    } catch {
      runInAction(() => {
        this.loadState = LoadState.FAILED;
        this.loadError = LOAD_ERROR_MESSAGE;
      });
    }
  }
}
