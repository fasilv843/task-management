import { InjectionToken, Provider } from '@angular/core';
import { ValidationErrors } from '@angular/forms';

import {
  BoundValidationError,
  LengthValidationError,
  ValidationErrorKey,
  ValidationMessageFactory,
  ValidationMessages,
} from './validation.types';

function isLengthError(error: unknown): error is LengthValidationError {
  return typeof error === 'object' && error !== null && 'requiredLength' in error;
}

function isBoundError(error: unknown): error is BoundValidationError {
  return typeof error === 'object' && error !== null && 'actual' in error;
}

/**
 * The wording every field gets unless it says otherwise.
 *
 * Messages are written against the field's `label` so one entry covers every
 * control that can raise the error — which is what stops each form from
 * re-spelling "… is required." for itself.
 */
export const DEFAULT_VALIDATION_MESSAGES: Readonly<
  Record<ValidationErrorKey, ValidationMessageFactory>
> = {
  [ValidationErrorKey.REQUIRED]: (_error, label) => `${label} is required.`,
  [ValidationErrorKey.NON_BLANK]: (_error, label) => `${label} is required.`,
  [ValidationErrorKey.MIN_LENGTH]: (error, label) =>
    isLengthError(error)
      ? `${label} must be at least ${error.requiredLength} characters.`
      : `${label} is too short.`,
  [ValidationErrorKey.MAX_LENGTH]: (error, label) =>
    isLengthError(error)
      ? `${label} must be ${error.requiredLength} characters or fewer.`
      : `${label} is too long.`,
  [ValidationErrorKey.MIN]: (error, label) =>
    isBoundError(error) && error.min !== undefined
      ? `${label} must be ${error.min} or more.`
      : `${label} is too small.`,
  [ValidationErrorKey.MAX]: (error, label) =>
    isBoundError(error) && error.max !== undefined
      ? `${label} must be ${error.max} or less.`
      : `${label} is too large.`,
  [ValidationErrorKey.EMAIL]: () => 'Enter a valid email address.',
  [ValidationErrorKey.PATTERN]: (_error, label) => `${label} is not in the expected format.`,
  [ValidationErrorKey.INVALID_DATE]: () => 'Enter a valid date.',
  [ValidationErrorKey.NOT_IN_PAST]: (_error, label) => `${label} cannot be in the past.`,
};

/**
 * Which error to speak about when a control breaks several rules at once.
 *
 * Angular hands back an object, so without an explicit order the message would
 * follow the order the validators happened to run in. Emptiness comes first
 * because "Title is required." is more useful than "Title must be 100
 * characters or fewer." on an empty field.
 */
export const VALIDATION_ERROR_PRIORITY: readonly ValidationErrorKey[] = [
  ValidationErrorKey.REQUIRED,
  ValidationErrorKey.NON_BLANK,
  ValidationErrorKey.INVALID_DATE,
  ValidationErrorKey.NOT_IN_PAST,
  ValidationErrorKey.MIN_LENGTH,
  ValidationErrorKey.MAX_LENGTH,
  ValidationErrorKey.MIN,
  ValidationErrorKey.MAX,
  ValidationErrorKey.EMAIL,
  ValidationErrorKey.PATTERN,
];

/**
 * App-wide message overrides.
 *
 * Lets a whole application (or a lazily loaded feature) restate the default
 * wording without any component knowing about it.
 */
export const VALIDATION_MESSAGES = new InjectionToken<ValidationMessages>('VALIDATION_MESSAGES', {
  providedIn: 'root',
  factory: () => ({}),
});

/** Registers overrides for the injector it is provided in. */
export function provideValidationMessages(messages: ValidationMessages): Provider {
  return { provide: VALIDATION_MESSAGES, useValue: messages };
}

/**
 * Picks the message for a control's current errors.
 *
 * Returns `null` when nothing matches, so an error key the app has no wording
 * for renders nothing rather than leaking a key name into the UI.
 */
export function resolveValidationMessage(
  errors: ValidationErrors | null,
  label: string,
  ...overrides: readonly (ValidationMessages | undefined)[]
): string | null {
  if (!errors) {
    return null;
  }

  const registry: ValidationMessages = Object.assign(
    {},
    DEFAULT_VALIDATION_MESSAGES,
    ...overrides.filter((override): override is ValidationMessages => override !== undefined),
  ) as ValidationMessages;

  const activeKeys = Object.keys(errors);
  const prioritised = VALIDATION_ERROR_PRIORITY.filter((key) => activeKeys.includes(key));
  const remaining = activeKeys.filter(
    (key) => !VALIDATION_ERROR_PRIORITY.includes(key as ValidationErrorKey),
  );

  for (const key of [...prioritised, ...remaining]) {
    const entry = registry[key];

    if (entry === undefined) {
      continue;
    }

    return typeof entry === 'function' ? entry(errors[key], label) : entry;
  }

  return null;
}
