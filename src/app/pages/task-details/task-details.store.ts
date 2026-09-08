import { Injectable, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { makeAutoObservable, runInAction } from 'mobx';

import { CommentStore } from '../../services/comment-store';
import { TaskStore } from '../../services/task-store';
import { CommentNode, CommentReply } from '../../services/comment.types';
import { Task } from '../../services/task.types';

const DELETE_ERROR_MESSAGE = "Couldn't delete the task. Please try again.";

/**
 * Everything the task details page knows.
 *
 * Page-scoped, not root: it is listed in `TaskDetails`' own `providers`, so a
 * fresh one is built for each visit and destroyed with the page. That is what
 * lets it own throwaway state — which reply box is open, what the last save
 * announced — without any of it leaking into the next task the user opens.
 *
 * Because it is component-provided it can read `ActivatedRoute` itself, which
 * is the last piece of wiring the page would otherwise have to do. The page
 * renders; this decides.
 *
 * It owns very little state of its own. The task and its thread live in
 * `TaskStore` and `CommentStore`; the getters below are just the two of them
 * read together, which is what replaced the old combined `?comments=true` read.
 */
@Injectable()
export class TaskDetailsStore {
  private readonly taskStore = inject(TaskStore);
  private readonly commentStore = inject(CommentStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /** From the `:id` route param. Null until the first emission. */
  taskId: string | null = null;

  /** Which comment's reply box is open. Only ever one, so errors have one home. */
  activeReplyId: string | null = null;

  /** Announced politely; the change is otherwise only visible further down the page. */
  statusMessage: string | null = null;

  deleteError: string | null = null;

  constructor() {
    makeAutoObservable<TaskDetailsStore, 'taskStore' | 'commentStore' | 'route' | 'router'>(
      this,
      { taskStore: false, commentStore: false, route: false, router: false },
      { autoBind: true },
    );

    this.route.paramMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => this.setTaskId(params.get('id')));

    // Both stores are idempotent, so this is a no-op when the user arrived from
    // the list page and costs one fetch each on a deep link.
    void this.taskStore.loadTasks();
    void this.commentStore.loadComments();
  }

  get task(): Task | undefined {
    return this.taskId === null ? undefined : this.taskStore.taskById(this.taskId);
  }

  get commentTree(): CommentNode[] {
    return this.taskId === null ? [] : this.commentStore.threadFor(this.taskId);
  }

  get commentCount(): number {
    return this.taskId === null ? 0 : this.commentStore.countFor(this.taskId);
  }

  get isOverdue(): boolean {
    const task = this.task;

    return task !== undefined && this.taskStore.isOverdue(task);
  }

  get isLoading(): boolean {
    return this.taskStore.isLoading || this.commentStore.isLoading;
  }

  /** Either store failing fails the page — it cannot render half of itself. */
  get loadError(): string | null {
    return this.taskStore.loadError ?? this.commentStore.loadError;
  }

  /** A finished load that turned up nothing: a deleted or mistyped id. */
  get isNotFound(): boolean {
    return !this.isLoading && this.loadError === null && this.task === undefined;
  }

  get isSavingComment(): boolean {
    return this.commentStore.isSaving;
  }

  get commentError(): string | null {
    return this.commentStore.saveError;
  }

  /** The error belongs to whichever box is open, so only one ever shows it. */
  get topLevelCommentError(): string | null {
    return this.activeReplyId === null ? this.commentError : null;
  }

  retryLoad(): void {
    void this.taskStore.reloadTasks();
    void this.commentStore.reloadComments();
  }

  openReply(commentId: string): void {
    // Reopening the same box closes it, and opening another moves the single
    // form rather than stacking a second one.
    this.activeReplyId = this.activeReplyId === commentId ? null : commentId;
    this.commentStore.clearSaveError();
  }

  cancelReply(): void {
    this.activeReplyId = null;
    this.commentStore.clearSaveError();
  }

  /** Posts a top-level comment. Resolves to whether it saved. */
  addComment(text: string): Promise<boolean> {
    return this.submitComment(text, null);
  }

  /** Posts a reply — the same call with a parent, which is what lets threads nest. */
  addReply(reply: CommentReply): Promise<boolean> {
    return this.submitComment(reply.text, reply.parentCommentId);
  }

  async deleteTask(): Promise<void> {
    const task = this.task;

    if (task === undefined) {
      return;
    }

    runInAction(() => {
      this.deleteError = null;
    });

    const deleted = await this.taskStore.deleteTask(task.id);

    if (deleted) {
      await this.goToTasks();

      return;
    }

    runInAction(() => {
      this.deleteError = DELETE_ERROR_MESSAGE;
    });
  }

  editTask(): void {
    if (this.taskId !== null) {
      void this.router.navigate(['/tasks/update', this.taskId]);
    }
  }

  goToTasks(): Promise<boolean> {
    return this.router.navigate(['/tasks']);
  }

  private setTaskId(id: string | null): void {
    this.taskId = id;
    this.activeReplyId = null;
    this.statusMessage = null;
    this.deleteError = null;
  }

  /**
   * The single write path for the thread: a reply is just a comment with a
   * parent, which is what keeps nesting unbounded.
   */
  private async submitComment(text: string, parentCommentId: string | null): Promise<boolean> {
    const taskId = this.taskId;

    if (taskId === null || this.isSavingComment) {
      return false;
    }

    runInAction(() => {
      this.statusMessage = null;
    });

    const created = await this.commentStore.addComment({ taskId, parentCommentId, text });

    if (created === null) {
      return false;
    }

    runInAction(() => {
      this.activeReplyId = null;
      this.statusMessage = parentCommentId === null ? 'Comment added.' : 'Reply added.';
    });

    return true;
  }
}
