import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  forwardRef,
  input,
  viewChild,
} from '@angular/core';

import { FormField } from '../form-field/form-field';
import { BaseFormControl } from '../../shared/base-form-control';
import { FocusableFormField } from '../../shared/focusable-form-field';
import { InvalidFieldDirective } from '../../shared/directives/invalid-field.directive';
import { CommonInputType } from './common-input.types';

/**
 * The app's text-entry field.
 *
 * Everything about showing a validation error — when to show it, what it says,
 * the red border, `aria-invalid`, `aria-describedby` — is inherited, so a form
 * declares a label and its validators and nothing more:
 *
 * ```html
 * <app-common-input label="Title" formControlName="title" />
 * <app-common-input label="Notes" type="textarea" formControlName="notes" />
 * ```
 *
 * Deadlines and other dates use `CommonDateInput`, which owns the `min`/`max`
 * boundary as well as the markup.
 */
@Component({
  selector: 'app-common-input',
  imports: [FormField],
  templateUrl: './common-input.html',
  styleUrl: './common-input.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [InvalidFieldDirective],
  providers: [{ provide: FocusableFormField, useExisting: forwardRef(() => CommonInput) }],
  host: {
    class: 'block',
  },
})
export class CommonInput extends BaseFormControl<string> {
  readonly type = input<CommonInputType>('text');

  readonly placeholder = input('');

  readonly autocomplete = input<string | null>(null);

  /** Rows for the `textarea` type; ignored by every other type. */
  readonly rows = input(3);

  protected readonly isTextarea = computed(() => this.type() === 'textarea');

  private readonly controlElement =
    viewChild<ElementRef<HTMLInputElement | HTMLTextAreaElement>>('control');

  focus(): void {
    this.controlElement()?.nativeElement.focus();
  }

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;

    // Kept in step with the DOM so a later programmatic write of the same value
    // is still a no-op rather than a missed update.
    this.value.set(target.value);
    this.onChange(target.value);
  }
}
