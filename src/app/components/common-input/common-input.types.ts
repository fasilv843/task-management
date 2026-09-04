/**
 * What `CommonInput` renders.
 *
 * Every member except `textarea` is passed straight through as the native
 * `<input type>`, so this is a union of HTML attribute values rather than a set
 * of application states — a string literal is exactly what the DOM wants, and it
 * is still checked at every call site.
 *
 * Dates are absent on purpose: they grew behaviour beyond an attribute (a `min`
 * boundary, local-date parsing) and so became `CommonDateInput`. A field type
 * that does the same should follow it out rather than joining this union.
 */
export type CommonInputType =
  | 'text'
  | 'number'
  | 'email'
  | 'password'
  | 'search'
  | 'tel'
  | 'url'
  | 'textarea';
