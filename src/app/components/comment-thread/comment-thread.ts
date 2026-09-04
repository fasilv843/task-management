import {
  ChangeDetectionStrategy,
  Component,
  afterRenderEffect,
  computed,
  forwardRef,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';

import { CommentForm } from '../comment-form/comment-form';
import { CommonButton } from '../common-button/common-button';
import { CommentNode, CommentReply } from '../../services/comment.types';

/** Past this level the indent stops growing, so a deep thread cannot overflow. */
const MAX_INDENT_DEPTH = 5;

/**
 * Renders one comment and, beneath it, its replies — by rendering itself.
 *
 * The recursion is the whole implementation: nesting is unbounded because
 * nothing here counts levels or caps them. Depth only ever affects indentation.
 *
 * Purely presentational. Reply state (which box is open, whether a save is in
 * flight, any failure) is owned by the page and passed down, and reply events
 * are re-emitted back up one level at a time.
 */
@Component({
  selector: 'app-comment-thread',
  // forwardRef is load-bearing, not decoration: a decorator's arguments are
  // evaluated before the class binding exists, so a bare self-reference here
  // would throw at load.
  imports: [DatePipe, CommentForm, CommonButton, forwardRef(() => CommentThread)],
  templateUrl: './comment-thread.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentThread {
  readonly node = input.required<CommentNode>();

  /** Id of the comment whose reply box is open, if any. */
  readonly activeReplyId = input<number | null>(null);

  readonly isSaving = input(false);

  readonly replyError = input<string | null>(null);

  readonly replyRequested = output<number>();

  readonly replyCancelled = output<void>();

  readonly replySubmitted = output<CommentReply>();

  protected readonly isReplying = computed(() => this.activeReplyId() === this.node().id);

  protected readonly indentClass = computed(() =>
    this.node().depth < MAX_INDENT_DEPTH ? 'pl-4' : 'pl-2',
  );

  /**
   * "Reply" alone repeats down the page, so the accessible name carries the
   * comment it answers. The visible text stays a prefix of it (WCAG 2.5.3).
   */
  protected readonly replyLabel = computed(() => {
    const text = this.node().text.trim().replace(/\s+/g, ' ');
    const snippet = text.length > 50 ? `${text.slice(0, 50)}…` : text;

    return `Reply to: ${snippet}`;
  });

  private readonly replyButton = viewChild<CommonButton>('replyButton');

  private readonly hadReplyOpen = signal(false);

  constructor() {
    // When this node's reply box closes — posted or cancelled — focus goes back
    // to the button that opened it, rather than being dropped at the top of the
    // document. Done after render, once the box has actually left the DOM.
    afterRenderEffect(() => {
      const isReplying = this.isReplying();
      const hadReplyOpen = untracked(this.hadReplyOpen);

      this.hadReplyOpen.set(isReplying);

      if (hadReplyOpen && !isReplying) {
        untracked(this.replyButton)?.focus();
      }
    });
  }

  protected onReplySubmitted(text: string): void {
    this.replySubmitted.emit({ parentCommentId: this.node().id, text });
  }
}
