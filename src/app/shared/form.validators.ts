import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Rejects values that are empty once surrounding whitespace is removed.
 *
 * Generic enough to sit outside any one feature — the task title and the comment
 * box both need it, and neither owns it.
 */
export function nonBlank(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;

  if (typeof value !== 'string' || value.trim().length > 0) {
    return null;
  }

  return { nonBlank: true };
}
