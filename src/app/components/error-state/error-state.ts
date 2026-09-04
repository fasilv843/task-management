import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { CommonButton } from '../common-button/common-button';

/**
 * ErrorState
 *
 * The "we couldn't load this" block every page that reads a resource needs.
 * Announced via role="alert", and always paired with a way out — the parent
 * decides what Retry does, which in practice is `resource.reload()`.
 *
 * Usage:
 *   <app-error-state
 *     message="Couldn't load your tasks."
 *     (retry)="tasksResource.reload()"
 *   />
 */
@Component({
  selector: 'app-error-state',
  imports: [CommonButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      class="border border-danger-ink bg-danger-bg px-6 py-8 text-center"
      role="alert"
    >
      <p class="font-medium text-ink">{{ message() }}</p>
      <p class="mt-1 text-sm text-ink-soft">{{ hint() }}</p>
      <app-common-button
        class="mt-4"
        variant="outline"
        [label]="retryLabel()"
        (buttonClick)="retry.emit()"
      />
    </div>
  `,
})
export class ErrorState {
  readonly message = input.required<string>();
  readonly hint = input('Check your connection and try again.');
  readonly retryLabel = input('Retry');

  readonly retry = output<void>();
}
