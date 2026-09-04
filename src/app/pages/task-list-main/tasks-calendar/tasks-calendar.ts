import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';

import { CommonButton } from '../../../components/common-button/common-button';
import { CommonTab } from '../../../components/common-tab/common-tab';
import { ErrorState } from '../../../components/error-state/error-state';
import { TaskCalendar } from '../../../components/task-calendar/task-calendar';
import { TaskStore } from '../../../services/task-store';
import { TASK_STATUS_LABELS, TaskStatus } from '../../../services/task.types';
import { TASK_STATUS_EVENT_COLORS } from '../../../components/task-calendar/task-calendar.types';
import { TASK_VIEW_TABS } from '../../../shared/task-view-tabs';

/**
 * The calendar half of the task browser — same data as the list page, placed by
 * deadline. It owns the resource and the navigation; drawing the month is
 * TaskCalendar's job.
 */
@Component({
  selector: 'app-tasks-calendar',
  imports: [ErrorState, TaskCalendar],
  templateUrl: './tasks-calendar.html',
  styleUrl: './tasks-calendar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksCalendar {
  private readonly taskStore = inject(TaskStore);
  private readonly router = inject(Router);

  protected readonly statusLabels = TASK_STATUS_LABELS;
  protected readonly viewTabs = TASK_VIEW_TABS;
  protected readonly legend = [
    TaskStatus.PENDING,
    TaskStatus.IN_PROGRESS,
    TaskStatus.COMPLETED,
  ].map((status) => ({ status, colors: TASK_STATUS_EVENT_COLORS[status] }));

  readonly tasksResource = rxResource({
    stream: () => this.taskStore.getTasks(),
  });

  switchView(id: string): void {
    this.router.navigate(['/tasks', id]);
  }

  openTask(id: string): void {
    this.router.navigate(['/tasks', id]);
  }

  addTask(): void {
    this.router.navigate(['/tasks', 'create']);
  }
}
