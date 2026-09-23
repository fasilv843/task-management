import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { TabOption } from './common-tab.types';

/**
 * CommonTab
 *
 * A row of navigation tabs for a set of mutually exclusive views that each have
 * their own route. Every tab is a real `<a href>`, so middle-click, Ctrl/Cmd
 * click and the right-click "Open link in new tab" menu all behave the way the
 * browser's own links do — which is the whole reason this is not built on
 * CommonButton. It carries no button state (no variant, tone, size, disabled)
 * and emits nothing: the router owns navigation, and `routerLinkActive` owns
 * which tab reads as current.
 *
 * Usage:
 *   <app-common-tab [tabs]="viewTabs" ariaLabel="Task views" />
 *
 *   readonly viewTabs: readonly TabOption[] = [
 *     { label: 'List', route: ['/tasks', 'list'] },
 *     { label: 'Calendar', route: ['/tasks', 'calendar'] },
 *   ];
 *
 * The markup is a named `<nav>` landmark of links, not the `role="tablist"`
 * ARIA pattern — that one is for switching in-page panels with roving arrow-key
 * focus, which these tabs are not doing.
 */
@Component({
  selector: 'app-common-tab',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './common-tab.css',
  host: { class: 'inline-flex' },
  template: `
    <nav [attr.aria-label]="ariaLabel()">
      <ul class="tabs">
        @for (tab of tabs(); track tab.label) {
          <li>
            <a
              class="tab"
              [routerLink]="tab.route"
              routerLinkActive="tab--active"
              [routerLinkActiveOptions]="{ exact: true }"
              ariaCurrentWhenActive="page"
              >{{ tab.label }}</a
            >
          </li>
        }
      </ul>
    </nav>
  `,
})
export class CommonTab {
  readonly tabs = input.required<readonly TabOption[]>();
  /** Names the `<nav>` landmark — required, a landmark without a name is a11y noise. */
  readonly ariaLabel = input.required<string>();
}
