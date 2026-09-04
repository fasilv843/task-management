import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { isBeforeToday, parseDateOnly, todayDateOnly } from '../utils/date.utils';

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

/**
 * Rejects a `YYYY-MM-DD` value that falls before today.
 *
 * Failing carries the boundary with it — `{ notInPast: { earliest } }` — so the
 * message can name the earliest acceptable date instead of the form restating a
 * rule the validator already knows.
 *
 * `exemptValue` lets one stored value through even when it is in the past.
 * Editing an already-overdue task passes its own deadline, so changing only the
 * status doesn't force a new date, while typing any *other* past date still
 * fails. Pair it with `earliestSelectable` on the input so the picker and the
 * validator agree on what is reachable.
 */
export function notInPast(exemptValue?: () => string | null): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: unknown = control.value;

    // Emptiness is `Validators.required`'s to report, not ours.
    if (typeof value !== 'string' || value.length === 0) {
      return null;
    }

    if (exemptValue?.() === value) {
      return null;
    }

    if (Number.isNaN(parseDateOnly(value).getTime())) {
      return { invalidDate: true };
    }

    return isBeforeToday(value) ? { notInPast: { earliest: todayDateOnly() } } : null;
  };
}
