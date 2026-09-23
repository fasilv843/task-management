import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { CommonButton } from '../../components/common-button/common-button';
import { CommonTab } from '../../components/common-tab/common-tab';
import { TabOption } from '../../components/common-tab/common-tab.types';

@Component({
  selector: 'app-task-list-main',
  imports: [
    RouterOutlet,
    CommonButton,
    CommonTab,
  ],
  templateUrl: './task-list-main.html',
  styleUrl: './task-list-main.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListMain {
  private readonly router = inject(Router);

  /**
   * The tabs are links, so the active one follows the URL on its own through
   * `routerLinkActive` — nothing here needs to read or mirror the route.
   */
  readonly viewTabs: readonly TabOption[] = [
    { label: 'List', route: ['/tasks', 'list'] },
    { label: 'Calendar', route: ['/tasks', 'calendar'] },
  ];

  addTask(): void {
    this.router.navigate(['/tasks/create']);
  }
}
