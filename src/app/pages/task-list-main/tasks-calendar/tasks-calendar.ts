import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { CommonCalendar } from '../../../components/common-calendar/common-calendar';
import { ErrorState } from '../../../components/error-state/error-state';
import { mobxToSignal } from '../../../state/mobx-to-signal';
import { TaskStore } from '../../../services/task-store';
import {
  TASK_STATUS_EVENT_COLORS,
  TASK_STATUS_LABELS,
  TaskStatus,
} from '../../../services/task.types';

/**
 * The calendar half of the task browser — same data as the list page, placed by
 * deadline.
 *
 * Both halves read one store, so they can never show different tasks and
 * switching tabs costs no second fetch. Turning a task into a calendar event is
 * `TaskStore.calendarEvents`; drawing the month is `CommonCalendar`'s job. This
 * component is the seam between them plus the navigation.
 */
@Component({
  selector: 'app-tasks-calendar',
  imports: [ErrorState, CommonCalendar],
  templateUrl: './tasks-calendar.html',
  styleUrl: './tasks-calendar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksCalendar {
  private readonly taskStore = inject(TaskStore);
  private readonly router = inject(Router);

  protected readonly statusLabels = TASK_STATUS_LABELS;
  protected readonly legend = [
    TaskStatus.PENDING,
    TaskStatus.IN_PROGRESS,
    TaskStatus.COMPLETED,
  ].map((status) => ({ status, colors: TASK_STATUS_EVENT_COLORS[status] }));

  protected readonly calendarEvents = mobxToSignal(() => this.taskStore.calendarEvents);
  protected readonly isLoading = mobxToSignal(() => this.taskStore.isLoading);
  protected readonly loadError = mobxToSignal(() => this.taskStore.loadError);

  /**
   * Latched, so a reload keeps the calendar on screen instead of dropping back
   * to the skeleton — rebuilding it would lose the view and month the user had
   * paged to.
   */
  protected readonly hasLoaded = mobxToSignal(() => this.taskStore.hasLoaded);

  constructor() {
    // Idempotent: the list tab and this one share the single fetch.
    void this.taskStore.loadTasks();
  }

  protected retryLoad(): void {
    void this.taskStore.reloadTasks();
  }

  openTask(id: string): void {
    void this.router.navigate(['/tasks', id]);
  }
}
