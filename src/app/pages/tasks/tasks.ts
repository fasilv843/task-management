import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CommonButton } from '../../components/common-button/common-button';
import { ErrorState } from '../../components/error-state/error-state';
import { RichTextContent } from '../../components/rich-text-content/rich-text-content';
import { TaskViewSwitcher } from '../../components/task-view-switcher/task-view-switcher';
import { TaskView } from '../../components/task-view-switcher/task-view-switcher.types';
import { TaskStore } from '../../services/task-store';
import { DateService } from '../../services/date-service';
import { TASK_STATUS_LABELS, Task, TaskListItem, TaskStatus } from '../../services/task.types';

@Component({
  selector: 'app-tasks',
  imports: [DatePipe, CommonButton, ErrorState, RichTextContent, TaskViewSwitcher],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tasks {
  private readonly taskStore = inject(TaskStore);
  private readonly dateService = inject(DateService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly TaskStatus = TaskStatus;
  readonly TaskView = TaskView;
  readonly statusLabels = TASK_STATUS_LABELS;

  readonly tasksResource = rxResource({
    stream: () => this.taskStore.getTasks(),
  });

  readonly taskItems = computed<TaskListItem[]>(() => {
    const tasks = this.tasksResource.value() ?? [];
    const today = this.dateService.startOfToday();

    return tasks.map((task) => ({
      ...task,
      isOverdue:
        task.status !== TaskStatus.COMPLETED &&
        this.dateService.parseDateOnly(task.deadline) < today,
    }));
  });

  readonly totalCount = computed(() => this.taskItems().length);

  readonly inProgressCount = computed(
    () => this.taskItems().filter((task) => task.status === TaskStatus.IN_PROGRESS).length,
  );

  readonly overdueCount = computed(() => this.taskItems().filter((task) => task.isOverdue).length);

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
