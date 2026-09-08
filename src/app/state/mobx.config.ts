import { configure } from 'mobx';

/**
 * Global MobX settings, applied once at startup.
 *
 * Call this before the first store is constructed — from `app.config.ts` for
 * the app and from `test-setup.ts` for the suite, so both run under identical
 * rules and a mistake cannot pass in one and fail in the other.
 */
export function configureMobx(): void {
  configure({
    // State may only change inside an action. This is the rule that keeps the
    // architecture honest: a component cannot reach in and assign to a store
    // field, because MobX throws if it tries. Every mutation has to be a named
    // method on the store, which is exactly where we want the logic to live.
    enforceActions: 'observed',

    // Deliberately left off: `computedRequiresReaction` and
    // `observableRequiresReaction` warn whenever state is read outside a
    // reaction, which is normal and correct in our actions and our specs. They
    // would only produce noise to learn to ignore.
  });
}
