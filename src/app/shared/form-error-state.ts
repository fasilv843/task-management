import { Signal, afterNextRender, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormGroupDirective, NgControl } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { merge, of, switchMap } from 'rxjs';

import {
  VALIDATION_MESSAGES,
  ValidationMessages,
  resolveValidationMessage,
} from './validation-messages';

/** The two facts every field needs about its control: is it erroring, and what to say. */
export interface ControlErrorState {
  /** Whether the error treatment (border, `aria-invalid`, message) should show. */
  readonly hasError: Signal<boolean>;
  /** The message to render, or `null` when nothing should be shown. */
  readonly message: Signal<string | null>;
}

export interface ControlErrorStateOptions {
  /** The control to watch. May be `null` until the form directive wires it up. */
  readonly control: Signal<AbstractControl | null>;
  /** The field's visible label, interpolated into the default messages. */
  readonly label?: Signal<string>;
  /** Per-field wording, layered over the injected and default registries. */
  readonly messages?: Signal<ValidationMessages | undefined>;
}

/** A control resolved from an `NgControl`, plus the poll that keeps it current. */
export interface BoundControl {
  readonly control: Signal<AbstractControl | null>;
  /** Call from `ngDoCheck`, so a control swapped at runtime is picked up. */
  readonly sync: () => void;
}

/**
 * Tracks the control an `NgControl` directive is bound to, as a signal.
 *
 * `NgControl.control` is assigned only *after* `setUpControl` has run, so it is
 * still unset when the value accessor's `registerOnChange` fires, and the
 * directive ordering on a node doesn't promise it by `ngOnInit` either. Angular
 * exposes no hook for the moment it lands, so it is polled — one reference
 * comparison per check — with a guaranteed first read after the initial render.
 *
 * Must be called in an injection context.
 */
export function bindNgControl(ngControl: NgControl | null): BoundControl {
  const control = signal<AbstractControl | null>(null);

  const sync = (): void => {
    const current = ngControl?.control ?? null;

    if (current !== control()) {
      control.set(current);
    }
  };

  afterNextRender(sync);

  return { control: control.asReadonly(), sync };
}

/**
 * Whether a control's errors should be visible yet.
 *
 * Errors stay hidden until the user has had a chance to fill the field in, so a
 * pristine form doesn't open covered in red.
 */
export function isErrorVisible(control: AbstractControl, wasSubmitted: boolean): boolean {
  return control.invalid && (control.touched || wasSubmitted);
}

/**
 * The one place form state is bridged into the signal graph.
 *
 * Reactive Forms report through Observables, so under zoneless nothing repaints
 * without this. Merging the *root's* events is load-bearing:
 * `FormGroupDirective.onSubmit` emits `FormSubmittedEvent` on the root form,
 * never on the child control, and the public `submitted` getter is `untracked`
 * by design — so without it a submitted-but-untouched field would stay silent.
 *
 * Must be called in an injection context (a field initialiser or constructor).
 */
export function createControlErrorState(options: ControlErrorStateOptions): ControlErrorState {
  const formGroupDirective = inject(FormGroupDirective, { optional: true });
  const injectedMessages = inject(VALIDATION_MESSAGES);

  const { control, label, messages } = options;

  const controlEvents = toSignal(
    toObservable(control).pipe(
      switchMap((current) => (current ? merge(current.events, current.root.events) : of(null))),
    ),
    { initialValue: null },
  );

  const hasError = computed(() => {
    // Establishes the dependency that re-runs this on any form change.
    controlEvents();

    const current = control();

    return !!current && isErrorVisible(current, formGroupDirective?.submitted ?? false);
  });

  const message = computed(() => {
    if (!hasError()) {
      return null;
    }

    return resolveValidationMessage(
      control()?.errors ?? null,
      label?.() ?? '',
      injectedMessages,
      messages?.(),
    );
  });

  return { hasError, message };
}
