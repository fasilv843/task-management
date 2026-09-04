import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { AbstractControl, FormGroupDirective } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { merge, switchMap } from 'rxjs';

import { isErrorVisible } from './form-validation-error.utils';

/**
 * Renders the validation message for a single reactive-forms control.
 *
 * Drop it next to any control — it works out when to show itself, so no reveal
 * wiring is repeated per field:
 * ```html
 * <app-form-validation-error [control]="form.controls.title" [messages]="titleErrorMessages" />
 * ```
 */
@Component({
  selector: 'app-form-validation-error',
  template: `
    <span class="form-validation-error__text">{{ message() }}</span>
  `,
  styleUrl: './form-validation-error.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.form-validation-error--visible]': '!!message()',
    '[attr.id]': 'fieldId()',
    'aria-live': 'polite',
  },
})
export class FormValidationError {
  private readonly formGroupDirective = inject(FormGroupDirective, { optional: true });

  readonly control = input.required<AbstractControl>();

  /** Maps an error key (`required`, `maxlength`, …) to the message to show. */
  readonly messages = input.required<Record<string, string>>();

  /** Set so the field can point `aria-describedby` at this message. */
  readonly fieldId = input<string | null>(null);

  /**
   * Bridges form state into the signal graph.
   *
   * Reactive Forms report through Observables, so under zoneless nothing would
   * repaint without this. `control` is an input signal, hence toObservable +
   * switchMap rather than reading it once.
   *
   * Merging the *root's* events is load-bearing: `FormGroupDirective.onSubmit`
   * emits `FormSubmittedEvent` on the root form, never on the child control, and
   * the public `submitted` getter is `untracked` by design — so without this a
   * submitted-but-untouched field would stay silent.
   */
  private readonly controlEvents = toSignal(
    toObservable(this.control).pipe(
      switchMap((control) => merge(control.events, control.root.events)),
    ),
    { initialValue: null },
  );

  readonly message = computed(() => {
    // Establishes the dependency that re-runs this on any form change.
    this.controlEvents();

    const control = this.control();

    if (!isErrorVisible(control, this.formGroupDirective?.submitted ?? false)) {
      return null;
    }

    const messages = this.messages();
    const errorKey = Object.keys(control.errors ?? {}).find((key) => key in messages);

    return errorKey ? messages[errorKey] : null;
  });
}
