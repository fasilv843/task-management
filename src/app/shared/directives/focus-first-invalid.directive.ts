import { Directive, ElementRef, contentChildren, inject } from '@angular/core';
import { FormGroupDirective } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FocusableFormField } from '../focusable-form-field';

/**
 * Sends focus to the first invalid field when a form is submitted.
 *
 * ```html
 * <form [formGroup]="form" (ngSubmit)="onSubmit()" appFocusFirstInvalid novalidate>
 * ```
 *
 * Order comes from a content query, whose results Angular returns in DOM order,
 * so no form has to keep a list of its own fields in sync with its template.
 * Anything providing `FocusableFormField` joins in automatically — including the
 * rich text editor, whose editing area isn't a focusable element the DOM can
 * find on its own.
 */
@Directive({
  selector: 'form[appFocusFirstInvalid]',
})
export class FocusFirstInvalidDirective {
  private readonly formGroupDirective = inject(FormGroupDirective, { optional: true, self: true });
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly fields = contentChildren(FocusableFormField, { descendants: true });

  constructor() {
    // `ngSubmit` is an @Output, not a DOM event, so a host listener would never
    // see it. Subscribing also runs this before the form's own handler, which is
    // why the touched marking happens here rather than being relied on there.
    this.formGroupDirective?.ngSubmit
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.focusFirstInvalid());
  }

  private focusFirstInvalid(): void {
    const form = this.formGroupDirective?.form;

    if (!form || form.valid) {
      return;
    }

    form.markAllAsTouched();

    const field = this.fields().find((candidate) => candidate.control?.invalid ?? false);

    if (field) {
      field.focus();
      return;
    }

    // Fallback for a form whose controls aren't wrapped in a field component.
    const nativeControls = this.elementRef.nativeElement.querySelectorAll<HTMLElement>(
      'input[formcontrolname], select[formcontrolname], textarea[formcontrolname]',
    );

    for (const element of Array.from(nativeControls)) {
      const controlName = element.getAttribute('formcontrolname');

      if (controlName && form.get(controlName)?.invalid) {
        element.focus();
        return;
      }
    }
  }
}
