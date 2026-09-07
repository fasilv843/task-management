import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal } from '@angular/core';
import { PRIMARY_OUTLET, Router, RouterOutlet, UrlTree } from '@angular/router';
import { CommonTab } from '../../components/common-tab/common-tab';
import { CommonButton } from '../../components/common-button/common-button';

type TaskView = 'list' | 'calendar';

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

  /** The view segment of the URL, re-read after every completed navigation. */
  private readonly routeView = computed(() => {
    // While the very first navigation is still running there is no successful
    // one yet, so fall back to the in-flight navigation's target URL.
    const navigation = this.router.lastSuccessfulNavigation()
      ?? this.router.currentNavigation();

    const urlTree = navigation?.finalUrl
      ?? navigation?.initialUrl
      ?? this.router.parseUrl(this.router.url);

    return this.viewFromUrlTree(urlTree);
  });

  /**
   * Follows the route, but stays writable so `switchView` can highlight the new
   * tab immediately; the next navigation re-syncs it back to the URL.
   */
  readonly activeView = linkedSignal(() => this.routeView());

  readonly viewTabs = [
    { id: 'list', label: 'List' },
    { id: 'calendar', label: 'Calendar' },
  ];

  switchView(view: string): void {
    if (!this.isTaskView(view)) {
      return;
    }

    this.activeView.set(view);

    this.router.navigate(['/tasks', view]);
  }

  addTask(): void {
    this.router.navigate(['/tasks/create']);
  }

  /** Reads the view from `/tasks/<view>`, defaulting to the list view. */
  private viewFromUrlTree(urlTree: UrlTree): TaskView {
    const segments = urlTree.root.children[PRIMARY_OUTLET]?.segments ?? [];
    const viewSegment = segments[1]?.path;

    return this.isTaskView(viewSegment) ? viewSegment : 'list';
  }

  private isTaskView(value: string | undefined): value is TaskView {
    return value === 'list' || value === 'calendar';
  }
}
