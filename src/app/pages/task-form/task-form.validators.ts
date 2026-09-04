import { AbstractControl, ValidationErrors } from '@angular/forms';

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
