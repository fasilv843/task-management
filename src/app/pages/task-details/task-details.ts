import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { CommentForm } from '../../components/comment-form/comment-form';
import { CommonButton } from '../../components/common-button/common-button';
import { CommentThread } from '../../components/comment-thread/comment-thread';
import { ErrorState } from '../../components/error-state/error-state';
import { RichTextContent } from '../../components/rich-text-content/rich-text-content';
import { isBeforeToday } from '../../utils/date.utils';
import { TaskStore } from '../../services/task-store';
import { CommentReply } from '../../services/comment.types';
import { TASK_STATUS_LABELS, TaskStatus } from '../../services/task.types';
import { buildCommentTree } from './comment-tree.utils';
import { CommonBackButton } from "../../components/common-back-button/common-back-button";

@Component({
  selector: 'app-task-details',
  imports: [DatePipe, CommonButton, ErrorState, RichTextContent, CommentForm, CommentThread, CommonBackButton],
  templateUrl: './task-details.html',
  styleUrl: './task-details.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetails {
  private readonly taskStore = inject(TaskStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly TaskStatus = TaskStatus;
  readonly statusLabels = TASK_STATUS_LABELS;

  private readonly routeId = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))), {
    initialValue: null,
  });

  readonly taskId = computed(() => this.routeId());

  /**
   * One read for the whole page. `comments: true` is this fake API's
   * `?comments=true` — the task and its thread arrive together rather than
   * costing a second request and a second set of loading states.
   */
  readonly taskResource = rxResource({
    // An undefined param keeps the resource idle, which is how an unparseable
    // `:id` falls through to the not-found branch without a request.
    params: () => this.taskId() ?? undefined,
    stream: ({ params }) => this.taskStore.getTaskById(params, { comments: true }),
  });

  readonly isLoading = computed(() => this.taskResource.isLoading());

  readonly loadError = computed(() => this.taskResource.error());

  /** Reading `value()` on a failed resource throws, so the error is checked first. */
  readonly task = computed(() =>
    this.taskResource.error() ? undefined : this.taskResource.value(),
  );

  readonly commentTree = computed(() => buildCommentTree(this.task()?.comments ?? []));

  readonly commentCount = computed(() => this.task()?.comments.length ?? 0);

  readonly isOverdue = computed(() => {
    const task = this.task();

    if (!task || task.status === TaskStatus.COMPLETED) {
      return false;
    }

    return isBeforeToday(task.deadline);
  });

  /** Which comment's reply box is open. Only ever one, so errors have one home. */
  readonly activeReplyId = signal<string | null>(null);

  readonly isSavingComment = signal(false);

  readonly commentError = signal<string | null>(null);

  /** Announced politely; the change is otherwise only visible further down the page. */
  readonly statusMessage = signal<string | null>(null);

  readonly deleteError = signal<string | null>(null);

  private readonly topLevelForm = viewChild(CommentForm);

  addComment(text: string): void {
    this.submitComment(text, null);
  }

  addReply(reply: CommentReply): void {
    this.submitComment(reply.text, reply.parentCommentId);
  }

  openReply(commentId: string): void {
    // Reopening the same box closes it, and opening another moves the single
    // form rather than stacking a second one.
    this.activeReplyId.update((current) => (current === commentId ? null : commentId));
    this.commentError.set(null);
  }

  cancelReply(): void {
    this.activeReplyId.set(null);
    this.commentError.set(null);
  }

  editTask(): void {
    const taskId = this.taskId();

    if (taskId !== null) {
      this.router.navigate(['/tasks/update', taskId]);
    }
  }

  deleteTask(): void {
    const task = this.task();

    if (!task) {
      return;
    }

    const confirmed = confirm(`Delete "${task.title}"?`);

    if (!confirmed) {
      return;
    }

    // Goes through the store so the task and its comments disappear together.
    this.taskStore
      .deleteTask(task.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigate(['/tasks']),
        error: () => this.deleteError.set("Couldn't delete the task. Please try again."),
      });
  }

  backToTasks(): void {
    this.router.navigate(['/tasks']);
  }

  /**
   * The single write path: a reply is just a comment with a parent, which is
   * what lets the thread nest without limit.
   */
  private submitComment(text: string, parentCommentId: string | null): void {
    const taskId = this.taskId();

    if (taskId === null || this.isSavingComment()) {
      return;
    }

    this.isSavingComment.set(true);
    this.commentError.set(null);
    this.statusMessage.set(null);

    // Subscribing is deliberate: this is a command, not view state, and every
    // result lands in a signal — which is what keeps zoneless rendering correct.
    this.taskStore
      .addComment({ taskId, parentCommentId, text })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSavingComment.set(false);
          this.activeReplyId.set(null);

          // Only the top-level box survives the save; a reply box is destroyed
          // with its node, and clearing it here would wipe an unsent draft.
          if (parentCommentId === null) {
            this.topLevelForm()?.reset();
          }

          // Synchronous — the store is already seeded, so this costs no request.
          this.taskResource.reload();
          this.statusMessage.set(parentCommentId === null ? 'Comment added.' : 'Reply added.');
        },
        error: () => {
          this.isSavingComment.set(false);
          this.commentError.set("Couldn't post that. Please try again.");
        },
      });
  }
}
