import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

import { CommonButton } from '../../../components/common-button/common-button';
import { CommonStatus } from '../../../components/common-status/common-status';
import { ErrorState } from '../../../components/error-state/error-state';
import { RichTextContent } from '../../../components/rich-text-content/rich-text-content';
import { mobxToSignal } from '../../../state/mobx-to-signal';
import { TaskStore } from '../../../services/task-store';
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_TONES,
  Task,
  TaskStatus,
} from '../../../services/task.types';

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

  readonly TaskStatus = TaskStatus;
  readonly statusLabels = TASK_STATUS_LABELS;
  readonly statusTones = TASK_STATUS_TONES;

  // Every row and flag below is derived in the store; these are the
  // MobX-to-signal readings the template binds. Nothing here holds state.
  readonly taskItems = mobxToSignal(() => this.taskStore.taskItems);
  readonly isLoading = mobxToSignal(() => this.taskStore.isLoading);
  readonly loadError = mobxToSignal(() => this.taskStore.loadError);

  constructor() {
    // Idempotent: the calendar tab and this one share the single fetch.
    void this.taskStore.loadTasks();
  }

  retryLoad(): void {
    void this.taskStore.reloadTasks();
  }

  // Absolute paths, not relative: this page lives at /tasks/list, so a relative
  // 'create' would resolve to /tasks/list/create.
  addTask(): void {
    void this.router.navigate(['/tasks', 'create']);
  }

  viewTask(task: Task): void {
    void this.router.navigate(['/tasks', task.id]);
  }

  editTask(task: Task): void {
    void this.router.navigate(['/tasks', 'update', task.id]);
  }

  deleteTask(task: Task): void {
    if (!confirm(`Delete "${task.title}"?`)) {
      return;
    }

    // No reload afterwards: the row is read from the store, so removing it
    // there is what makes it disappear here.
    void this.taskStore.deleteTask(task.id);
  }
}
