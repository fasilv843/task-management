import { Injectable, inject, signal, untracked } from '@angular/core';
import { Observable, map, of, switchMap, tap } from 'rxjs';

import { DateService } from './date-service';
import { TaskRepo } from './task-repo';
import { CommentDraft, TaskComment } from './comment.types';
import { Task, TaskDraft, TaskQueryOptions, TaskWithComments } from './task.types';

/**
 * Session state for tasks and their comments.
 *
 * `TaskRepo` fetches; this holds. Both collections are seeded once from the
 * static JSON behind the repo and then served from memory, because there is no
 * write endpoint to persist to — created tasks and comments live here for the
 * lifetime of the session.
 *
 * Comments deliberately share this store rather than getting one of their own:
 * they belong to the same aggregate, and keeping them together is what lets
 * `getTaskById(id, { comments: true })` answer from a single subscription.
 *
 * Reads are exposed as Observables so components can hand them to `rxResource`
 * and own their view state as signals.
 */
@Injectable({
  providedIn: 'root',
})
export class TaskStore {
  private readonly repo = inject(TaskRepo);
  private readonly dateService = inject(DateService);

  private readonly tasks = signal<Task[] | null>(null);

  private readonly comments = signal<TaskComment[] | null>(null);

  getTasks(): Observable<Task[]> {
    // Read untracked: `rxResource` evaluates its stream factory in a reactive
    // context, and a tracked read here would re-trigger the resource on every
    // store mutation.
    const cachedTasks = untracked(this.tasks);

    if (cachedTasks) {
      return of(cachedTasks);
    }

    return this.repo.fetchTasks().pipe(tap((tasks) => this.tasks.set(tasks)));
  }

  getTaskById(id: number): Observable<Task | undefined>;
  getTaskById(
    id: number,
    options: TaskQueryOptions & { comments: true },
  ): Observable<TaskWithComments | undefined>;
  getTaskById(
    id: number,
    options?: TaskQueryOptions,
  ): Observable<Task | TaskWithComments | undefined> {
    const taskRead = this.getTasks().pipe(map((tasks) => tasks.find((task) => task.id === id)));

    if (!options?.comments) {
      return taskRead;
    }

    // One subscription, one emission — and a missing task costs no comment read.
    return taskRead.pipe(
      switchMap((task) =>
        task
          ? this.getComments(task.id).pipe(map((comments) => ({ ...task, comments })))
          : of(undefined),
      ),
    );
  }

  createTask(draft: TaskDraft): Observable<Task> {
    // Piping off getTasks() seeds the store first, so this works even when the
    // form is opened directly without visiting the list page.
    return this.getTasks().pipe(
      map((tasks) => {
        const nextId = tasks.reduce((highest, task) => Math.max(highest, task.id), 0) + 1;
        const created: Task = { ...draft, id: nextId };

        this.tasks.set([...tasks, created]);

        return created;
      }),
    );
  }

  updateTask(id: number, draft: TaskDraft): Observable<Task> {
    return this.getTasks().pipe(
      map((tasks) => {
        const index = tasks.findIndex((task) => task.id === id);

        if (index === -1) {
          throw new Error(`Task ${id} no longer exists.`);
        }

        const updated: Task = { ...draft, id };
        const nextTasks = [...tasks];
        nextTasks[index] = updated;

        this.tasks.set(nextTasks);

        return updated;
      }),
    );
  }

  deleteTask(id: number): Observable<void> {
    return this.getTasks().pipe(
      map((tasks) => {
        this.tasks.set(tasks.filter((task) => task.id !== id));

        // The comments referenced this task; leaving them behind would strand
        // rows against a foreign key that no longer resolves.
        const cachedComments = untracked(this.comments);

        if (cachedComments) {
          this.comments.set(cachedComments.filter((comment) => comment.taskId !== id));
        }
      }),
    );
  }

  /** The comment thread for one task, in no particular order. */
  getComments(taskId: number): Observable<TaskComment[]> {
    return this.loadComments().pipe(
      map((comments) => comments.filter((comment) => comment.taskId === taskId)),
    );
  }

  /**
   * Adds a comment. A reply is the same call with `parentCommentId` set to the
   * comment being answered — there is no separate reply path, which is what
   * keeps nesting unbounded.
   */
  addComment(draft: CommentDraft): Observable<TaskComment> {
    return this.loadComments().pipe(
      map((comments) => {
        const nextId =
          comments.reduce((highest, comment) => Math.max(highest, comment.id), 0) + 1;

        const created: TaskComment = {
          ...draft,
          id: nextId,
          createdAt: this.dateService.nowIso(),
        };

        this.comments.set([...comments, created]);

        return created;
      }),
    );
  }

  /** Every comment across every task, seeded from the repo on first use. */
  private loadComments(): Observable<TaskComment[]> {
    const cachedComments = untracked(this.comments);

    if (cachedComments) {
      return of(cachedComments);
    }

    return this.repo.fetchComments().pipe(tap((comments) => this.comments.set(comments)));
  }
}
