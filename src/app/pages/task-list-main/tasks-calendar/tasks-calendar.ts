import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';

import { CommonCalendar } from '../../../components/common-calendar/common-calendar';
import { CalendarEvent } from '../../../components/common-calendar/common-calendar.types';
import { ErrorState } from '../../../components/error-state/error-state';
import { TaskStore } from '../../../services/task-store';
import { TASK_STATUS_LABELS, Task, TaskStatus } from '../../../services/task.types';
import { formatDateLabel } from '../../../utils/date.utils';
import { TASK_STATUS_EVENT_COLORS } from './tasks-calendar.types';

/**
 * The calendar half of the task browser — same data as the list page, placed by
 * deadline. It owns the resource, the navigation, and the translation of a task
 * into a calendar event; drawing the month is CommonCalendar's job.
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

  readonly tasksResource = rxResource({
    stream: () => this.taskStore.getTasks(),
  });

  protected readonly calendarEvents = computed<CalendarEvent[]>(() =>
    (this.tasksResource.value() ?? []).map((task) => this.toCalendarEvent(task)),
  );

  openTask(id: string): void {
    this.router.navigate(['/tasks', id]);
  }

  private toCalendarEvent(task: Task): CalendarEvent {
    return {
      id: task.id,
      title: task.title,
      date: task.deadline,
      // A real destination, so the event renders as an <a href> and stays
      // reachable by keyboard and openable in a new tab.
      url: `/tasks/${task.id}`,
      colors: TASK_STATUS_EVENT_COLORS[task.status],
      // Status reaches the label so colour is never the only carrier of it.
      ariaLabel: `${task.title}, ${TASK_STATUS_LABELS[task.status]}, due ${formatDateLabel(task.deadline)}`,
    };
  }
}
