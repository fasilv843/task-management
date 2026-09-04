import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { createControlErrorState } from '../../shared/form-error-state';
import { ValidationMessages } from '../../shared/validation-messages';

/**
 * Renders the validation message for a single reactive-forms control.
 *
 * Field components pass the message they have already resolved:
 * ```html
 * <app-form-validation-error [fieldId]="errorId()" [message]="message()" />
 * ```
 *
 * Dropped next to a raw control it works the reveal out for itself, so no
 * per-field wiring is repeated:
 * ```html
 * <app-form-validation-error label="Title" [control]="form.controls.title" />
 * ```
 */
@Component({
  selector: 'app-form-validation-error',
  template: ` <span class="form-validation-error__text">{{ displayedMessage() }}</span> `,
  styleUrl: './form-validation-error.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.form-validation-error--visible]': '!!displayedMessage()',
    '[attr.id]': 'fieldId()',
    'aria-live': 'polite',
  },
})
export class FormValidationError {
  /** A message resolved elsewhere. Set by field components; wins over `control`. */
  readonly message = input<string | null>(null);

  /** The control to watch when no `message` is supplied. */
  readonly control = input<AbstractControl | null>(null);

  /** The field's visible label, interpolated into the default messages. */
  readonly label = input('');

  /** Wording overrides for this field, layered over the app-wide registry. */
  readonly messages = input<ValidationMessages | undefined>(undefined);

  /** Set so the field can point `aria-describedby` at this message. */
  readonly fieldId = input<string | null>(null);

  private readonly ownState = createControlErrorState({
    control: this.control,
    label: this.label,
    messages: this.messages,
  });

  protected readonly displayedMessage = computed(() => this.message() ?? this.ownState.message());
}
