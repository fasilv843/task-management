import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';

import { CommentForm } from '../../components/comment-form/comment-form';
import { CommonBackButton } from '../../components/common-back-button/common-back-button';
import { CommonButton } from '../../components/common-button/common-button';
import { CommonStatus } from '../../components/common-status/common-status';
import { CommentThread } from '../../components/comment-thread/comment-thread';
import { ErrorState } from '../../components/error-state/error-state';
import { RichTextContent } from '../../components/rich-text-content/rich-text-content';
import { mobxToSignal } from '../../state/mobx-to-signal';
import { CommentReply } from '../../services/comment.types';
import { TASK_STATUS_LABELS, TASK_STATUS_TONES } from '../../services/task.types';
import { TaskDetailsStore } from './task-details.store';

/**
 * The task details page: the task, its thread, and the composer.
 *
 * All of the state — which task, which reply box, what a save is doing — lives
 * in `TaskDetailsStore`, provided here so it is created and destroyed with the
 * page. This class binds that state to the template and forwards events back.
 * The only decisions it makes are the two the DOM owns: showing the delete
 * confirmation, and clearing the composer after a successful post.
 */
@Component({
  selector: 'app-task-details',
  imports: [
    DatePipe,
    CommonButton,
    CommonStatus,
    ErrorState,
    RichTextContent,
    CommentForm,
    CommentThread,
    CommonBackButton,
  ],
  providers: [TaskDetailsStore],
  templateUrl: './task-details.html',
  styleUrl: './task-details.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetails {
  private readonly store = inject(TaskDetailsStore);

  readonly statusLabels = TASK_STATUS_LABELS;
  readonly statusTones = TASK_STATUS_TONES;

  readonly task = mobxToSignal(() => this.store.task);
  readonly commentTree = mobxToSignal(() => this.store.commentTree);
  readonly commentCount = mobxToSignal(() => this.store.commentCount);
  readonly isOverdue = mobxToSignal(() => this.store.isOverdue);
  readonly isLoading = mobxToSignal(() => this.store.isLoading);
  readonly loadError = mobxToSignal(() => this.store.loadError);
  readonly activeReplyId = mobxToSignal(() => this.store.activeReplyId);
  readonly isSavingComment = mobxToSignal(() => this.store.isSavingComment);
  readonly commentError = mobxToSignal(() => this.store.commentError);
  readonly topLevelCommentError = mobxToSignal(() => this.store.topLevelCommentError);
  readonly statusMessage = mobxToSignal(() => this.store.statusMessage);
  readonly deleteError = mobxToSignal(() => this.store.deleteError);

  private readonly topLevelForm = viewChild(CommentForm);

  async addComment(text: string): Promise<void> {
    const saved = await this.store.addComment(text);

    // Only the top-level box is cleared here. A reply box is destroyed along
    // with its node, and clearing that one would wipe an unsent draft.
    if (saved) {
      this.topLevelForm()?.reset();
    }
  }

  addReply(reply: CommentReply): void {
    void this.store.addReply(reply);
  }

  openReply(commentId: string): void {
    this.store.openReply(commentId);
  }

  cancelReply(): void {
    this.store.cancelReply();
  }

  retryLoad(): void {
    this.store.retryLoad();
  }

  editTask(): void {
    this.store.editTask();
  }

  deleteTask(): void {
    const task = this.task();

    if (task && confirm(`Delete "${task.title}"?`)) {
      void this.store.deleteTask();
    }
  }

  backToTasks(): void {
    void this.store.goToTasks();
  }
}
