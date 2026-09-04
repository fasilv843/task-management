import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  forwardRef,
  input,
  viewChild,
} from '@angular/core';

import { FormField } from '../form-field/form-field';
import { BaseFormControl } from '../../shared/base-form-control';
import { FocusableFormField } from '../../shared/focusable-form-field';
import { InvalidFieldDirective } from '../../shared/directives/invalid-field.directive';
import { SelectOption } from './common-select.types';

/**
 * The app's single-choice field.
 *
 * Separate from `CommonInput` because a `<select>` is a different element with a
 * different contract — options, a placeholder choice — rather than another value
 * of a `type` input. Validation behaviour is shared through `BaseFormControl`.
 *
 * ```html
 * <app-common-select label="Status" [options]="statusOptions" formControlName="status" />
 * ```
 */
@Component({
  selector: 'app-common-select',
  imports: [FormField],
  templateUrl: './common-select.html',
  styleUrl: './common-select.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [InvalidFieldDirective],
  providers: [{ provide: FocusableFormField, useExisting: forwardRef(() => CommonSelect) }],
  host: {
    class: 'block',
  },
})
export class CommonSelect extends BaseFormControl<string> {
  readonly options = input.required<readonly SelectOption[]>();

  /** Text for an empty leading choice. Omit it when the control always has a value. */
  readonly placeholder = input<string | null>(null);

  private readonly controlElement = viewChild<ElementRef<HTMLSelectElement>>('control');

  focus(): void {
    this.controlElement()?.nativeElement.focus();
  }

  protected onSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    this.value.set(value);
    this.onChange(value);
  }
}
