import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CommonButton } from '../../../components/common-button/common-button';
import { CommonStatus } from '../../../components/common-status/common-status';
import { CommonTab } from '../../../components/common-tab/common-tab';
import { ErrorState } from '../../../components/error-state/error-state';
import { RichTextContent } from '../../../components/rich-text-content/rich-text-content';
import { TabOption } from '../../../components/common-tab/common-tab.types';
import { TaskStore } from '../../../services/task-store';
import { isBeforeToday } from '../../../utils/date.utils';
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_TONES,
  Task,
  TaskListItem,
  TaskStatus,
} from '../../../services/task.types';

const TASK_VIEW_TABS: readonly TabOption[] = [
  { id: 'list', label: 'List' },
  { id: 'calendar', label: 'Calendar' },
];

@Component({
  selector: 'app-tasks',
  imports: [DatePipe, CommonButton, CommonStatus, ErrorState, RichTextContent],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tasks {
  private readonly taskStore = inject(TaskStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly TaskStatus = TaskStatus;
  readonly statusLabels = TASK_STATUS_LABELS;
  readonly statusTones = TASK_STATUS_TONES;
  readonly viewTabs = TASK_VIEW_TABS;

  readonly tasksResource = rxResource({
    stream: () => this.taskStore.getTasks(),
  });

  readonly taskItems = computed<TaskListItem[]>(() => {
    const tasks = this.tasksResource.value() ?? [];

    return tasks.map((task) => ({
      ...task,
      isOverdue: task.status !== TaskStatus.COMPLETED && isBeforeToday(task.deadline),
    }));
  });

  readonly totalCount = computed(() => this.taskItems().length);

  readonly inProgressCount = computed(
    () => this.taskItems().filter((task) => task.status === TaskStatus.IN_PROGRESS).length,
  );

  readonly overdueCount = computed(() => this.taskItems().filter((task) => task.isOverdue).length);

  switchView(id: string): void {
    this.router.navigate(['/tasks', id]);
  }

  // Absolute paths, not relative: this page lives at /tasks/list, so a relative
  // 'create' would resolve to /tasks/list/create.
  addTask(): void {
    this.router.navigate(['/tasks', 'create']);
  }

  viewTask(task: Task): void {
    this.router.navigate(['/tasks', task.id]);
  }

  editTask(task: Task): void {
    this.router.navigate(['/tasks', 'update', task.id]);
  }

  deleteTask(task: Task): void {
    const confirmed = confirm(`Delete "${task.title}"?`);
    if (!confirmed) {
      return;
    }

    // Goes through the service so the store stays the single source of truth —
    // a purely local removal would reappear on the next navigation.
    this.taskStore
      .deleteTask(task.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.tasksResource.reload());
  }
}
