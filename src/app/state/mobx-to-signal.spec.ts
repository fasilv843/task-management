import { TestBed } from '@angular/core/testing';
import { Injectable, Signal, provideZonelessChangeDetection } from '@angular/core';
import { makeAutoObservable } from 'mobx';

import { mobxToSignal } from './mobx-to-signal';

@Injectable()
class CounterStore {
  count = 0;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get doubled(): number {
    return this.count * 2;
  }

  increment(): void {
    this.count += 1;
  }
}

/** Stands in for a component: bridges the store in an injection context. */
@Injectable()
class CounterView {
  private readonly store = new CounterStore();

  readonly count: Signal<number> = mobxToSignal(() => this.store.count);
  readonly doubled: Signal<number> = mobxToSignal(() => this.store.doubled);

  increment(): void {
    this.store.increment();
  }
}

describe('mobxToSignal', () => {
  function createView(): CounterView {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), CounterView],
    });

    return TestBed.inject(CounterView);
  }

  it('starts at the observable current value', () => {
    expect(createView().count()).toBe(0);
  });

  it('tracks a plain observable field', () => {
    const view = createView();

    view.increment();

    expect(view.count()).toBe(1);
  });

  it('tracks a computed getter', () => {
    const view = createView();

    view.increment();
    view.increment();

    expect(view.doubled()).toBe(4);
  });

  it('stops tracking once the injector is destroyed', () => {
    const view = createView();

    view.increment();
    expect(view.count()).toBe(1);

    // Disposing the autorun is what stops the reaction leaking past the
    // component that created it — after this, further mutations are ignored.
    TestBed.resetTestingModule();

    view.increment();
    expect(view.count()).toBe(1);
  });
});
