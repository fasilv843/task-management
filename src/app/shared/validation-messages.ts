import { InjectionToken, Provider } from '@angular/core';
import { ValidationErrors } from '@angular/forms';

import { formatDateLabel } from '../utils/date.utils';
import {
  LengthError,
  MaxError,
  MinError,
  NotInPastError,
  PatternError,
  ValidationMessageFactory,
} from './validation.types';

/**
 * The wording every field gets unless it says otherwise, and the app's list of
 * error keys — the two are the same thing on purpose.
 *
 * Keys are Angular's own error-key names (`required`, `maxlength`, …) plus the
 * ones our validators emit, so there is no enum restating them. Each factory
 * declares the payload its key carries, which is what lets the message quote the
 * rule (`requiredLength`) and what the user actually did (`actualLength`) rather
 * than repeating a number the form would have to keep in step by hand.
 *
 * Messages are written against the field's `label`, so one entry covers every
 * control that can raise the error.
 */
export const DEFAULT_VALIDATION_MESSAGES = {
  required: (_error: true, label: string) => `${label} is required.`,
  nonBlank: (_error: true, label: string) => `${label} is required.`,
  minlength: (error: LengthError, label: string) =>
    `${label} must be at least ${error.requiredLength} characters — ${error.actualLength} entered.`,
  maxlength: (error: LengthError, label: string) =>
    `${label} must be ${error.requiredLength} characters or fewer — ${error.actualLength} entered.`,
  min: (error: MinError, label: string) => `${label} must be ${error.min} or more.`,
  max: (error: MaxError, label: string) => `${label} must be ${error.max} or less.`,
  email: () => 'Enter a valid email address.',
  pattern: (_error: PatternError, label: string) => `${label} is not in the expected format.`,
  invalidDate: () => 'Enter a valid date.',
  notInPast: (error: NotInPastError, label: string) =>
    `${label} cannot be earlier than ${formatDateLabel(error.earliest)}.`,
};

/**
 * Every error key the app knows how to talk about.
 *
 * Derived from the registry rather than declared beside it, so adding a message
 * is the only way to add a key and the two can never drift apart.
 */
export type ValidationErrorKey = keyof typeof DEFAULT_VALIDATION_MESSAGES;

/**
 * Wording overrides, for one field or for the whole app.
 *
 * A plain string is accepted wherever the wording doesn't depend on the error or
 * the label — the common case for a one-off override on a single field.
 *
 * Keys are checked against the registry, so a typo is a compile error. The other
 * side of that: a new custom validator has to earn a default message here before
 * any field can restate it, which is what keeps the registry complete.
 */
export type ValidationMessages = Partial<
  Record<ValidationErrorKey, ValidationMessageFactory | string>
>;

/**
 * Which error to speak about when a control breaks several rules at once.
 *
 * Angular hands back an object, so without an explicit order the message would
 * follow the order the validators happened to run in. Emptiness comes first
 * because "Title is required." is more useful than "Title must be 100
 * characters or fewer." on an empty field.
 */
export const VALIDATION_ERROR_PRIORITY: readonly ValidationErrorKey[] = [
  'required',
  'nonBlank',
  'invalidDate',
  'notInPast',
  'minlength',
  'maxlength',
  'min',
  'max',
  'email',
  'pattern',
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

  // `never` for the payload is what lets factories with different, specific error
  // types (`LengthError`, `MinError`, …) sit in one lookup: a parameter is
  // checked contravariantly, and every type accepts `never`.
  const registry: Record<string, ValidationMessageFactory<never> | string | undefined> =
    Object.assign(
      {},
      DEFAULT_VALIDATION_MESSAGES,
      ...overrides.filter((override): override is ValidationMessages => override !== undefined),
    );

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

    if (typeof entry !== 'function') {
      return entry;
    }

    // The one cast in the chain, and the honest place for it: Angular types every
    // error payload as `any`, so this is where an untyped value meets a factory
    // that has declared what it expects.
    return (entry as ValidationMessageFactory<unknown>)(errors[key], label);
  }

  return null;
}
