import { AbstractControl } from '@angular/forms';

/**
 * Whether a control's errors should be visible yet.
 *
 * Errors stay hidden until the user has had a chance to fill the field in, so a
 * pristine form doesn't open covered in red. Shared by `FormValidationError`
 * (which renders the message) and by forms styling their own invalid inputs, so
 * that both agree on exactly when a field is "showing an error".
 */
export function isErrorVisible(control: AbstractControl, wasSubmitted: boolean): boolean {
  return control.invalid && (control.touched || wasSubmitted);
}
