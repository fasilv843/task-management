import { Directive, DoCheck, computed, inject, input, signal } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NgControl } from '@angular/forms';

import { FocusableFormField } from './focusable-form-field';
import { bindNgControl, createControlErrorState } from './form-error-state';
import { ValidationMessages } from './validation-messages';

let uniqueFieldId = 0;

/**
 * Everything a form field needs that isn't its markup.
 *
 * Concrete fields (`CommonInput`, `CommonSelect`, `RichTextEditor`) inherit the
 * value accessor, the id/label/`aria-describedby` contract, and the error state,
 * and add only the control they render. Pages therefore declare a label and
 * validators, and nothing else.
 */
@Directive()
export abstract class BaseFormControl<TValue>
  implements ControlValueAccessor, FocusableFormField, DoCheck
{
  /**
   * Injected rather than provided through `NG_VALUE_ACCESSOR` so the field can
   * see its own control. Registering the accessor here instead is what breaks
   * the circular dependency that the provider form would create.
   */
  protected readonly ngControl = inject(NgControl, { optional: true, self: true });

  /** Visible label. Also the subject of every validation message for this field. */
  readonly label = input.required<string>();

  /** Keeps the label as an accessible name only — for compact fields like a reply box. */
  readonly labelHidden = input(false);

  /** Supporting text rendered under the control and linked via `aria-describedby`. */
  readonly hint = input<string | null>(null);

  /** Wording overrides for this field alone, layered over the app-wide registry. */
  readonly errorMessages = input<ValidationMessages | undefined>(undefined);

  /** Set it to pin the id (and so the error id); otherwise one is generated. */
  readonly fieldId = input<string>(`app-field-${uniqueFieldId++}`);

  readonly labelId = computed(() => `${this.fieldId()}-label`);
  readonly hintId = computed(() => `${this.fieldId()}-hint`);
  readonly errorId = computed(() => `${this.fieldId()}-error`);

  /**
   * The message region is always in the DOM (an `aria-live` region has to exist
   * before its content changes), so it is always described — no per-field
   * conditional wiring, and no chance of a form getting it half right.
   */
  readonly describedBy = computed(() =>
    [this.hint() ? this.hintId() : null, this.errorId()].filter(Boolean).join(' '),
  );

  protected readonly value = signal<TValue | null>(null);

  protected readonly isDisabled = signal(false);

  private readonly boundControl = bindNgControl(this.ngControl);

  private readonly errorState = createControlErrorState({
    control: this.boundControl.control,
    label: computed(() => this.label()),
    messages: this.errorMessages,
  });

  readonly hasError = this.errorState.hasError;

  readonly message = this.errorState.message;

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  get control(): AbstractControl | null {
    return this.boundControl.control();
  }

  ngDoCheck(): void {
    this.boundControl.sync();
  }

  abstract focus(): void;

  protected onChange: (value: TValue | null) => void = () => {};

  protected onTouched: () => void = () => {};

  writeValue(value: TValue | null): void {
    this.value.set(value);
  }

  registerOnChange(onChange: (value: TValue | null) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
