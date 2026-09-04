import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { FormBuilder, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';

import { CommonInput } from '../common-input/common-input';
import { FocusFirstInvalidDirective } from '../../shared/directives/focus-first-invalid.directive';
import { ValidationMessages } from '../../shared/validation-messages';
import { nonBlank } from '../../shared/form.validators';

/**
 * Plain-text composer for a comment or a reply.
 *
 * Presentational on purpose: it validates and emits, and never touches the
 * store. Saving state and failures are passed back in, so the page that owns the
 * write also owns the feedback — which is what keeps one reply form open at a
 * time from turning into several competing error messages.
 */
@Component({
  selector: 'app-comment-form',
  imports: [ReactiveFormsModule, CommonInput, FocusFirstInvalidDirective],
  templateUrl: './comment-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentForm {
  private readonly formBuilder = inject(FormBuilder);

  /** Accessible name for the textarea; shown to screen readers only, to keep replies compact. */
  readonly fieldLabel = input('Comment');

  readonly submitLabel = input('Comment');

  readonly placeholder = input('Write a comment…');

  /** Renders the busy state and blocks a second submit. */
  readonly isSaving = input(false);

  /** A failure from the save, shown above the buttons. */
  readonly errorMessage = input<string | null>(null);

  readonly showCancel = input(false);

  /** Moves focus into the textarea on creation — used when a reply box opens. */
  readonly autoFocus = input(false);

  readonly submitted = output<string>();

  readonly cancelled = output<void>();

  protected readonly form = this.formBuilder.nonNullable.group({
    text: ['', [Validators.required, nonBlank, Validators.maxLength(1000)]],
  });

  /**
   * The accessible name here is a prompt ("Add a comment"), which doesn't read
   * as the subject of a sentence, so the wording is stated rather than derived
   * from the label the way the default messages do it.
   */
  protected readonly errorMessages: ValidationMessages = {
    required: 'Comment cannot be empty.',
    nonBlank: 'Comment cannot be empty.',
    maxlength: 'Comment must be 1000 characters or fewer.',
  };

  private readonly field = viewChild(CommonInput);

  /** Needed to clear the submitted flag on reset, which `form.reset()` leaves set. */
  private readonly formDirective = viewChild(FormGroupDirective);

  constructor() {
    afterNextRender(() => {
      if (this.autoFocus()) {
        this.focus();
      }
    });
  }

  focus(): void {
    this.field()?.focus();
  }

  /**
   * Clears the box after a successful save.
   *
   * Goes through the directive rather than `form.reset()`: the latter leaves
   * `submitted` true, so the freshly emptied field would immediately show its
   * own required error.
   */
  reset(): void {
    this.formDirective()?.resetForm({ text: '' });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      // `appFocusFirstInvalid` handles the real submit; this covers the rest.
      this.form.markAllAsTouched();
      return;
    }

    if (this.isSaving()) {
      return;
    }

    this.submitted.emit(this.form.getRawValue().text.trim());
  }
}
