import { AbstractControl } from '@angular/forms';

/**
 * DI contract for anything that owns a form control and can take focus.
 *
 * Field components provide themselves under this token
 * (`{ provide: FocusableFormField, useExisting: CommonInput }`) so a form-level
 * directive can collect them with a content query — which returns them in DOM
 * order, and therefore in the order the user reads them. That is what lets
 * `FocusFirstInvalidDirective` work without any form listing its own fields.
 */
export abstract class FocusableFormField {
  /** The control this field is bound to, or `null` before the form wires it up. */
  abstract readonly control: AbstractControl | null;

  /** Moves keyboard focus to whatever the user actually types into. */
  abstract focus(): void;
}
