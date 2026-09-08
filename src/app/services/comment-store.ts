import { Injectable, inject } from '@angular/core';
import { makeAutoObservable, observableRef, runInAction } from 'mobx';
import { firstValueFrom } from 'rxjs';

import { LoadState, SaveState } from '../state/load-state';
import { nowIso } from '../utils/date.utils';
import { TaskRepo } from './task-repo';
import { buildCommentTree } from './comment-tree.utils';
import { CommentDraft, CommentNode, TaskComment } from './comment.types';

const LOAD_ERROR_MESSAGE = "Couldn't load the comments.";
const SAVE_ERROR_MESSAGE = "Couldn't post that. Please try again.";

/**
 * Every comment in the app, and the state of reading and writing them.
 *
 * The collection is flat, exactly as it is stored — a `parentCommentId` self
 * reference is what makes threads nest, so nothing here counts or caps depth.
 * `threadFor` rebuilds the tree on read.
 *
 * Seeded once from the static JSON behind `TaskRepo` and then served from
 * memory: there is no write endpoint, so comments added in a session live here
 * for its lifetime.
 */
@Injectable({
  providedIn: 'root',
})
export class CommentStore {
  private readonly repo = inject(TaskRepo);

  /** Flat, unordered. Read it through `commentsFor` or `threadFor`. */
  comments: readonly TaskComment[] = [];

  loadState = LoadState.IDLE;

  loadError: string | null = null;

  /**
   * True once comments have arrived, and never false again — including while a
   * reload is in flight. See the same field on `TaskStore` for why `loadState`
   * alone cannot answer this.
   */
  hasLoaded = false;

  saveState = SaveState.IDLE;

  saveError: string | null = null;

  constructor() {
    // The second type argument names the private field, which TypeScript
    // otherwise leaves out of the annotation map.
    makeAutoObservable<CommentStore, 'repo'>(
      this,
      {
        // An injected service is not state. Left in, MobX would try to make the
        // whole repo observable.
        repo: false,
        // By reference: MobX tracks the array as a whole and leaves the
        // comments inside it as plain objects. Every mutation below replaces
        // the array rather than editing a row in place, so per-object tracking
        // would cost proxies and buy nothing — and it keeps plain objects
        // flowing out to the templates.
        comments: observableRef,
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

  /**
   * The comment thread for one task, nested and oldest-first.
   *
   * A plain method rather than a `computed`, because a MobX computed cannot
   * take an argument. It still re-runs correctly inside a reaction — it reads
   * `comments`, so `mobxToSignal` tracks it — it simply isn't memoised across
   * calls. At this data size that is not worth a `computedFn` dependency.
   */
  threadFor(taskId: string): CommentNode[] {
    return buildCommentTree(this.commentsFor(taskId));
  }

  /** The flat rows for one task, in no particular order. */
  commentsFor(taskId: string): TaskComment[] {
    return this.comments.filter((comment) => comment.taskId === taskId);
  }

  countFor(taskId: string): number {
    return this.commentsFor(taskId).length;
  }

  /** Seeds the store on first use. Calling it again is free. */
  async loadComments(): Promise<void> {
    if (this.hasLoaded || this.isLoading) {
      return;
    }

    await this.fetchComments();
  }

  /** Forces a refetch — what a failed load's Retry button calls. */
  async reloadComments(): Promise<void> {
    if (this.isLoading) {
      return;
    }

    await this.fetchComments();
  }

  /**
   * Adds a comment, and returns it — or `null` if the save failed, so the
   * caller can tell the two apart without inspecting `saveError`.
   *
   * A reply is this same call with `parentCommentId` set to the comment being
   * answered. There is no separate reply path, which is what keeps nesting
   * unbounded.
   */
  async addComment(draft: CommentDraft): Promise<TaskComment | null> {
    if (this.isSaving) {
      return null;
    }

    runInAction(() => {
      this.saveState = SaveState.SAVING;
      this.saveError = null;
    });

    // The thread has to be in memory before we can append to it, so a deep link
    // straight to a task page can still post a comment.
    await this.loadComments();

    if (this.loadError !== null) {
      runInAction(() => {
        this.saveState = SaveState.FAILED;
        this.saveError = SAVE_ERROR_MESSAGE;
      });

      return null;
    }

    const created: TaskComment = {
      ...draft,
      id: crypto.randomUUID(),
      createdAt: nowIso(),
    };

    runInAction(() => {
      this.comments = [...this.comments, created];
      this.saveState = SaveState.SAVED;
    });

    return created;
  }

  /**
   * Drops every comment on a task. Called by `TaskStore` when the task is
   * deleted — leaving these behind would strand rows against a foreign key that
   * no longer resolves.
   */
  removeForTask(taskId: string): void {
    this.comments = this.comments.filter((comment) => comment.taskId !== taskId);
  }

  /** Clears a failed save so a retry starts from a clean slate. */
  clearSaveError(): void {
    this.saveError = null;
    this.saveState = SaveState.IDLE;
  }

  private async fetchComments(): Promise<void> {
    runInAction(() => {
      this.loadState = LoadState.LOADING;
      this.loadError = null;
    });

    try {
      const comments = await firstValueFrom(this.repo.fetchComments());

      runInAction(() => {
        this.comments = comments;
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
