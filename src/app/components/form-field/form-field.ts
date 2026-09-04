import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { FormValidationError } from '../form-validation-error/form-validation-error';

/**
 * The frame every form field is rendered in: label, control, hint, message.
 *
 * Presentational only — it holds no control and no validation logic. Its job is
 * that a field looks and reads the same everywhere, and that the label, hint and
 * message ids line up for assistive tech without each field re-deriving them.
 */
@Component({
  selector: 'app-form-field',
  imports: [FormValidationError],
  templateUrl: './form-field.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class FormField {
  readonly label = input.required<string>();

  /**
   * Id of the control the label points at. Leave it `null` for a control with no
   * labelable element — the rich text editor's body, say — and a plain `<span>`
   * carrying `labelId` is rendered for `aria-labelledby` to reference instead.
   */
  readonly labelFor = input<string | null>(null);

  readonly labelId = input<string | null>(null);

  /** Keeps the label as an accessible name only, for compact fields. */
  readonly labelHidden = input(false);

  readonly hint = input<string | null>(null);

  readonly hintId = input<string | null>(null);

  readonly errorId = input.required<string>();

  /** The already-resolved validation message, or `null` while the field is fine. */
  readonly message = input<string | null>(null);

  protected readonly labelClass = computed(() =>
    this.labelHidden() ? 'sr-only' : 'block text-sm font-medium text-ink',
  );
}
