/**
 * What `CommonInput` renders.
 *
 * Every member except `TEXTAREA` is passed straight through as the native
 * `<input type>`; `TEXTAREA` swaps the element. A field type that grows its own
 * behaviour beyond an attribute (a date picker, a currency mask) should become
 * its own component extending `BaseFormControl` rather than a member here.
 */
export enum InputType {
  TEXT = 'text',
  DATE = 'date',
  NUMBER = 'number',
  EMAIL = 'email',
  PASSWORD = 'password',
  SEARCH = 'search',
  TEL = 'tel',
  URL = 'url',
  TEXTAREA = 'textarea',
}
