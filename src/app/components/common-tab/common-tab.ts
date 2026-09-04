import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { CommonButton } from '../common-button/common-button';
import { TabOption } from './common-tab.types';

/**
 * CommonTab
 *
 * A row of buttons standing in for a set of mutually exclusive views — the
 * active one reads as pressed (`filled`), the rest as `subtle`. It only ever
 * emits which tab was picked; the parent decides what that means (switch a
 * local signal, navigate to another route, etc).
 *
 * Usage:
 *   <app-common-tab
 *     [tabs]="taskViewTabs"
 *     [active]="'list'"
 *     ariaLabel="Task views"
 *     (tabSelect)="onViewChange($event)"
 *   />
 */
@Component({
  selector: 'app-common-tab',
  imports: [CommonButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
  template: `
    <div class="flex gap-2" [attr.aria-label]="ariaLabel()">
      @for (tab of tabs(); track tab.id) {
        <app-common-button
          [variant]="tab.id === active() ? 'filled' : 'subtle'"
          size="sm"
          [label]="tab.label"
          [attr.aria-current]="tab.id === active() ? 'page' : null"
          (buttonClick)="tabSelect.emit(tab.id)"
        />
      }
    </div>
  `,
})
export class CommonTab {
  readonly tabs = input.required<readonly TabOption[]>();
  readonly active = input<string>();
  readonly ariaLabel = input<string>();

  readonly tabSelect = output<string>();
}
