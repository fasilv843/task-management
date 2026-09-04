import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TASK_VIEW_LABELS, TASK_VIEW_ROUTES, TaskView } from './task-view-switcher.types';

/**
 * TaskViewSwitcher
 *
 * Moves between the two task pages, /tasks/list and /tasks/calendar. Sits in
 * the header of both, which is the whole reason it is a component.
 *
 * These are real anchors rather than CommonButton, unlike the rest of the app:
 * each view is its own addressable page, so the control belongs in a <nav>,
 * should be announced as a link, and should support middle-click / open in a
 * new tab. The current view stays focusable (never disabled) and is marked with
 * aria-current="page".
 */
@Component({
  selector: 'app-task-view-switcher',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './task-view-switcher.css',
  template: `
    <nav aria-label="Task views">
      <ul class="flex border border-rule">
        @for (view of views; track view) {
          <li>
            <a
              class="view-link"
              [class.view-link--active]="view === active()"
              [routerLink]="routes[view]"
              [attr.aria-current]="view === active() ? 'page' : null"
            >
              {{ labels[view] }}
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
})
export class TaskViewSwitcher {
  readonly active = input.required<TaskView>();

  protected readonly views = [TaskView.LIST, TaskView.CALENDAR];
  protected readonly labels = TASK_VIEW_LABELS;
  protected readonly routes = TASK_VIEW_ROUTES;
}
