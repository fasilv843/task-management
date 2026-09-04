import { Directive, DoCheck, ElementRef, computed, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

import { bindNgControl, createControlErrorState } from '../form-error-state';

/**
 * Marks a form control as invalid once its error is due to be shown.
 *
 * Adds the global `.field--invalid` class, which carries the red border, and
 * sets `aria-invalid` when it sits on a native control. Applied to the field
 * components through `hostDirectives`, so `CommonInput`, `CommonSelect` and
 * `RichTextEditor` get the treatment for free, and usable on its own for a raw
 * control that isn't wrapped in one:
 *
 * ```html
 * <input formControlName="title" appInvalidField />
 * ```
 */
@Directive({
  selector: '[appInvalidField]',
  host: {
    '[class.field--invalid]': 'hasError()',
    '[attr.aria-invalid]': 'ariaInvalid()',
  },
})
export class InvalidFieldDirective implements DoCheck {
  private readonly ngControl = inject(NgControl, { optional: true, self: true });
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly boundControl = bindNgControl(this.ngControl);

  readonly hasError = createControlErrorState({ control: this.boundControl.control }).hasError;

  /**
   * Only native controls take `aria-invalid` from here. On a field component the
   * host element is a wrapper — the real control lives inside it and sets the
   * attribute itself, so claiming it here would point assistive tech at the
   * wrong element.
   */
  private readonly isNativeControl =
    this.elementRef.nativeElement.matches?.('input, select, textarea') ?? false;

  protected readonly ariaInvalid = computed(() =>
    this.isNativeControl && this.hasError() ? 'true' : null,
  );

  ngDoCheck(): void {
    this.boundControl.sync();
  }
}
