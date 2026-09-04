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
import { todayDateOnly } from '../../utils/date.utils';

/**
 * The app's date field.
 *
 * Split out of `CommonInput` because a date is more than an attribute: it has a
 * selectable range, and the value it exchanges is a `YYYY-MM-DD` string that has
 * to be read as a *local* date (see `date.utils`). Everything about showing a
 * validation error is still inherited from `BaseFormControl`, so a form declares
 * a label, its validators and a boundary:
 *
 * ```html
 * <app-common-date-input label="Deadline" formControlName="deadline" [min]="minDeadline()" />
 * ```
 */
@Component({
  selector: 'app-common-date-input',
  imports: [FormField],
  templateUrl: './common-date-input.html',
  styleUrl: './common-date-input.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [InvalidFieldDirective],
  providers: [{ provide: FocusableFormField, useExisting: forwardRef(() => CommonDateInput) }],
  host: {
    class: 'block',
  },
})
export class CommonDateInput extends BaseFormControl<string> {
  /**
   * Earliest selectable date, `YYYY-MM-DD`.
   *
   * Reaches the native `min` attribute, so the picker refuses what the validator
   * would reject rather than offering a date and then complaining about it. Pair
   * it with `notInPast` — `earliestSelectable` keeps the two in step.
   */
  readonly min = input<string | null>(null);

  /** Latest selectable date, `YYYY-MM-DD`. */
  readonly max = input<string | null>(null);

  private readonly controlElement = viewChild<ElementRef<HTMLInputElement>>('control');

  focus(): void {
    this.controlElement()?.nativeElement.focus();
  }

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;

    // Kept in step with the DOM so a later programmatic write of the same value
    // is still a no-op rather than a missed update.
    this.value.set(target.value);
    this.onChange(target.value);
  }
}

/**
 * The `min` for a field that may not accept past dates but has one stored value
 * that is exempt.
 *
 * Returns the earlier of the exempt value and today, so an already-overdue
 * task's deadline stays reachable in the picker — the same allowance
 * `notInPast(exemptValue)` makes in validation.
 */
export function earliestSelectable(exempt: string | null): string {
  const today = todayDateOnly();

  // Both are `YYYY-MM-DD`, which sorts lexicographically the same way it sorts
  // chronologically — no parsing needed to compare them.
  return exempt !== null && exempt < today ? exempt : today;
}
