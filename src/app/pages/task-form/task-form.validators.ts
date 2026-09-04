import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { DateService } from '../../services/date-service';

/** Rejects values that are empty once surrounding whitespace is removed. */
export function nonBlank(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;

  if (typeof value !== 'string' || value.trim().length > 0) {
    return null;
  }

  return { nonBlank: true };
}

/**
 * Rejects a `YYYY-MM-DD` deadline that falls before today.
 *
 * Parsing goes through `DateService.parseDateOnly` rather than `new Date(value)`,
 * which would read the string as UTC midnight and land on the previous day for
 * anyone west of Greenwich.
 *
 * `exemptValue` supplies a deadline that is allowed through even when it is in
 * the past. Editing an already-overdue task passes its stored deadline here, so
 * changing only the status doesn't force the user to pick a new date — while
 * typing any *other* past date is still rejected.
 */
export function notInPast(
  dateService: DateService,
  exemptValue?: () => string | null,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: unknown = control.value;

    if (typeof value !== 'string' || value.length === 0) {
      return null;
    }

    if (exemptValue?.() === value) {
      return null;
    }

    const deadline = dateService.parseDateOnly(value);

    if (Number.isNaN(deadline.getTime())) {
      return { invalidDate: true };
    }

    return deadline < dateService.startOfToday() ? { notInPast: true } : null;
  };
}

/**
 * Required check for rich text.
 *
 * An empty Quill editor reports `<p><br></p>` rather than an empty string, so
 * `Validators.required` would pass on a visually blank description. This strips
 * markup and entities and fails when no real text or embedded media remains.
 */
export function richTextRequired(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;

  if (typeof value !== 'string') {
    return { required: true };
  }

  // Images and other embeds are real content even though they carry no text.
  if (/<(img|video|iframe)\b/i.test(value)) {
    return null;
  }

  const text = value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/[​﻿]/g, '')
    .trim();

  return text.length > 0 ? null : { required: true };
}
