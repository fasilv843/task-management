/**
 * The payloads Angular's validators put under each error key.
 *
 * `ValidationErrors` is typed `{ [key: string]: any }`, and Angular publishes no
 * type for what actually lands under `minlength` or `min`, so these mirror what
 * the built-ins emit. They exist for one reason: to type the `error` argument of
 * a message factory, so the wording can read `requiredLength` straight off the
 * error instead of guarding for it at runtime. They are not domain models, and
 * nothing outside this folder should need to name them.
 */

/** `Validators.minLength` / `Validators.maxLength`. */
export interface LengthError {
  requiredLength: number;
  actualLength: number;
}

/** `Validators.min`. */
export interface MinError {
  min: number;
  actual: number;
}

/** `Validators.max`. */
export interface MaxError {
  max: number;
  actual: number;
}

/** `Validators.pattern`. */
export interface PatternError {
  requiredPattern: string;
  actualValue: string;
}

/** Our own `notInPast`; carries the earliest date the field will accept. */
export interface NotInPastError {
  earliest: string;
}

/**
 * Builds the wording for one error.
 *
 * `error` is whatever the validator put under its key and `label` is the field's
 * visible label, so a single message serves every field that can raise the error.
 */
export type ValidationMessageFactory<TError = unknown> = (error: TError, label: string) => string;
