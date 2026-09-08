import { configureMobx } from './app/state/mobx.config';

// The suite runs under the same MobX rules as the app, so a mistake cannot pass
// in one and fail in the other.
configureMobx();

/**
 * jsdom ships no `ResizeObserver`, and components that watch their own size
 * are rendered throughout the suite. A no-op stub keeps those renders working;
 * specs that need to drive resizes install a capturing stub of their own.
 */
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
}
