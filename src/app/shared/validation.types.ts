
// TODO - use the values in the error object in validation error


/**
 * The validation error keys the app knows how to talk about.
 *
 * Error keys are a closed set, so they are modelled as an enum rather than
 * scattered string literals. The values match the keys Angular's built-in
 * validators emit (`required`, `maxlength`, …) and the keys our own validators
 * emit (`nonBlank`, `invalidDate`, `notInPast`), which is what lets one registry
 * serve every control in the app.
 */
export enum ValidationErrorKey {
  REQUIRED = 'required',
  NON_BLANK = 'nonBlank',
  MIN_LENGTH = 'minlength',
  MAX_LENGTH = 'maxlength',
  MIN = 'min',
  MAX = 'max',
  EMAIL = 'email',
  PATTERN = 'pattern',
  INVALID_DATE = 'invalidDate',
  NOT_IN_PAST = 'notInPast',
}

/**
 * Builds the message for one error.
 *
 * `error` is the value Angular put under the key (e.g. `{ requiredLength: 100,
 * actualLength: 140 }` for `maxlength`) and `label` is the field's visible
 * label, so a single message serves every field that can raise the error.
 */
export type ValidationMessageFactory = (error: unknown, label: string) => string;

/**
 * A partial override of the default messages, keyed by error key.
 *
 * A plain string is accepted wherever the wording doesn't depend on the error or
 * the label — the common case for a one-off override on a single field.
 */
export type ValidationMessages = Readonly<Record<string, ValidationMessageFactory | string>>;

/** Payload Angular attaches to a `minlength` / `maxlength` error. */
export interface LengthValidationError {
  requiredLength: number;
  actualLength: number;
}

/** Payload Angular attaches to a `min` / `max` error. */
export interface BoundValidationError {
  min?: number;
  max?: number;
  actual: number;
}
