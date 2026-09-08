import { DestroyRef, Signal, inject, signal } from '@angular/core';
// Aliased on purpose. MobX and Angular both export `untracked`, and they are
// not interchangeable — this file needs MobX's. Do not "tidy" this import.
import { autorun, untracked as mobxUntracked } from 'mobx';

/**
 * Reads MobX state as an Angular signal.
 *
 * This is the only place the two reactivity systems meet, and it is small on
 * purpose. MobX tracks whatever observables `compute` touched and re-runs the
 * `autorun` when any of them change; writing the result into an Angular signal
 * is what tells zoneless change detection that the view needs re-rendering.
 * Without that write nothing would repaint, because there is no zone to notice
 * the MobX mutation.
 *
 * `compute` can read anything reactive — a plain observable field, a `computed`
 * getter, or a store method that reads several. Keep it to a read: it runs
 * inside a reaction, so it must not mutate state or cause side effects.
 *
 * Must be called from an injection context (a component field initializer or a
 * constructor), because the autorun is disposed via `DestroyRef` when the
 * owning component or service is destroyed. Calling it anywhere else leaks the
 * reaction, and Angular will throw on the `inject()` anyway.
 *
 * @example
 * readonly tasks = mobxToSignal(() => this.taskStore.taskItems);
 */
export function mobxToSignal<T>(compute: () => T): Signal<T> {
  // Seeded untracked so the signal has a real value before the autorun starts;
  // the autorun's own first run immediately follows and takes over from there.
  const source = signal(mobxUntracked(compute));

  const dispose = autorun(() => source.set(compute()));

  inject(DestroyRef).onDestroy(dispose);

  return source.asReadonly();
}
