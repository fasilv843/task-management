import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { makeAutoObservable } from 'mobx';

import { TaskStore } from '../../services/task-store';
import { Task, TaskDraft } from '../../services/task.types';
import { TaskFormMode } from './task-form.types';

/**
 * Everything the create/update page knows apart from the form itself.
 *
 * Page-scoped, not root: listed in `TaskForm`'s own `providers`, so it is built
 * and destroyed with the page and can read `ActivatedRoute` directly.
 *
 * The `FormGroup` deliberately stays in the component. Reactive Forms is
 * already a state layer with its own validation and dirty tracking, and mirroring
 * it into MobX would give us two copies of the same truth. This store owns what
 * surrounds the form: which mode we are in, whether the task loaded, and what
 * happens when it is submitted.
 */
@Injectable()
export class TaskFormStore {
  private readonly taskStore = inject(TaskStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  /** From the `:id` route param. Null on `tasks/create`. */
  taskId: string | null = null;

  constructor() {
    makeAutoObservable<TaskFormStore, 'taskStore' | 'route' | 'router' | 'location'>(
      this,
      { taskStore: false, route: false, router: false, location: false },
      { autoBind: true },
    );

    this.route.paramMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => this.setTaskId(params.get('id')));

    // Update mode needs the task; create mode needs the collection anyway, so
    // that the new task can be appended to it. Idempotent either way.
    void this.taskStore.loadTasks();
  }

  get mode(): TaskFormMode {
    return this.taskId === null ? TaskFormMode.CREATE : TaskFormMode.UPDATE;
  }

  get isUpdateMode(): boolean {
    return this.mode === TaskFormMode.UPDATE;
  }

  /** The task being edited, once it has loaded. Always undefined in create mode. */
  get task(): Task | undefined {
    return this.taskId === null ? undefined : this.taskStore.taskById(this.taskId);
  }

  get isLoadingTask(): boolean {
    return this.isUpdateMode && this.taskStore.isLoading;
  }

  get loadError(): string | null {
    return this.isUpdateMode ? this.taskStore.loadError : null;
  }

  /** A finished load that turned up nothing: a deleted or mistyped id. */
  get isTaskMissing(): boolean {
    return this.isUpdateMode && !this.isLoadingTask && this.loadError === null && !this.task;
  }

  get canShowForm(): boolean {
    return !this.isLoadingTask && this.loadError === null && !this.isTaskMissing;
  }

  get isSaving(): boolean {
    return this.taskStore.isSaving;
  }

  get saveError(): string | null {
    return this.taskStore.saveError;
  }

  get pageTitle(): string {
    return this.isUpdateMode ? 'Update Task' : 'Create Task';
  }

  get submitLabel(): string {
    return this.isUpdateMode ? 'Update' : 'Create';
  }

  get submitButtonLabel(): string {
    return this.isSaving ? 'Saving…' : this.submitLabel;
  }

  retryLoad(): void {
    void this.taskStore.reloadTasks();
  }

  /**
   * Saves the draft as a create or an update depending on the route, and on
   * success returns to the list. Resolves to whether it saved, so the page can
   * leave the form up on failure with `saveError` showing.
   */
  async save(draft: TaskDraft): Promise<boolean> {
    if (this.isSaving) {
      return false;
    }

    const taskId = this.taskId;

    const saved =
      taskId === null
        ? await this.taskStore.createTask(draft)
        : await this.taskStore.updateTask(taskId, draft);

    if (saved === null) {
      return false;
    }

    await this.router.navigate(['/tasks']);

    return true;
  }

  /** Back where the user came from, or to the list if they arrived here directly. */
  cancel(): void {
    if (history.length > 1) {
      this.location.back();

      return;
    }

    void this.router.navigate(['/tasks']);
  }

  private setTaskId(id: string | null): void {
    this.taskId = id;
    this.taskStore.clearSaveError();
  }
}
