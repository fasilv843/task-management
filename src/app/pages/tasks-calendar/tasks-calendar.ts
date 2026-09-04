import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';

import { CommonButton } from '../../components/common-button/common-button';
import { ErrorState } from '../../components/error-state/error-state';
import { TaskCalendar } from '../../components/task-calendar/task-calendar';
import { TaskViewSwitcher } from '../../components/task-view-switcher/task-view-switcher';
import { TaskView } from '../../components/task-view-switcher/task-view-switcher.types';
import { TaskStore } from '../../services/task-store';
import { TASK_STATUS_LABELS, TaskStatus } from '../../services/task.types';
import { TASK_STATUS_EVENT_COLORS } from '../../components/task-calendar/task-calendar.types';

/**
 * The calendar half of the task browser — same data as the list page, placed by
 * deadline. It owns the resource and the navigation; drawing the month is
 * TaskCalendar's job.
 */
@Component({
  selector: 'app-tasks-calendar',
  imports: [CommonButton, ErrorState, TaskCalendar, TaskViewSwitcher],
  templateUrl: './tasks-calendar.html',
  styleUrl: './tasks-calendar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksCalendar {
  private readonly taskStore = inject(TaskStore);
  private readonly router = inject(Router);

  protected readonly TaskView = TaskView;
  protected readonly statusLabels = TASK_STATUS_LABELS;
  protected readonly legend = [
    TaskStatus.PENDING,
    TaskStatus.IN_PROGRESS,
    TaskStatus.COMPLETED,
  ].map((status) => ({ status, colors: TASK_STATUS_EVENT_COLORS[status] }));

  readonly tasksResource = rxResource({
    stream: () => this.taskStore.getTasks(),
  });

  openTask(id: number): void {
    this.router.navigate(['/tasks', id]);
  }

  addTask(): void {
    this.router.navigate(['/tasks', 'create']);
  }
}
