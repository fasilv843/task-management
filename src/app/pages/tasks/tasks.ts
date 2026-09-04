import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';

import { TaskService } from '../../services/task-service';
import { DateService } from '../../services/date-service';
import { TASK_STATUS_LABELS, Task, TaskListItem, TaskStatus } from '../../services/task.types';

@Component({
  selector: 'app-tasks',
  imports: [DatePipe],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tasks {
  private readonly taskService = inject(TaskService);
  private readonly dateService = inject(DateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly TaskStatus = TaskStatus;
  readonly statusLabels = TASK_STATUS_LABELS;

  readonly tasksResource = rxResource({
    stream: () => this.taskService.getTasks(),
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

  addTask(): void {
    this.router.navigate(['create'], { relativeTo: this.route });
  }

  viewTask(task: Task): void {
    this.router.navigate([task.id], { relativeTo: this.route });
  }

  editTask(task: Task): void {
    this.router.navigate(['update', task.id], { relativeTo: this.route });
  }

  deleteTask(task: Task): void {
    const confirmed = confirm(`Delete "${task.title}"?`);
    if (!confirmed) {
      return;
    }

    this.tasksResource.update((tasks) => tasks?.filter((t) => t.id !== task.id));
  }
}
