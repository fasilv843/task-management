import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { Location } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { CommonInput } from '../../components/common-input/common-input';
import { InputType } from '../../components/common-input/common-input.types';
import { CommonSelect } from '../../components/common-select/common-select';
import { ErrorState } from '../../components/error-state/error-state';
import { RichTextEditor } from '../../components/rich-text-editor/rich-text-editor';
import { FocusFirstInvalidDirective } from '../../shared/directives/focus-first-invalid.directive';
import { TaskStore } from '../../services/task-store';
import { DateService } from '../../services/date-service';
import { TASK_STATUS_LABELS, TaskDraft, TaskStatus } from '../../services/task.types';
import { nonBlank } from '../../shared/form.validators';
import { TaskFormMode, TaskStatusOption } from './task-form.types';
import { notInPast, richTextRequired } from './task-form.validators';

@Component({
  selector: 'app-task-form',
  imports: [
    ReactiveFormsModule,
    CommonInput,
    CommonSelect,
    ErrorState,
    RichTextEditor,
    FocusFirstInvalidDirective,
  ],
  templateUrl: './task-form.html',
  styleUrl: './task-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskForm {
  private readonly taskStore = inject(TaskStore);
  private readonly dateService = inject(DateService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly location = inject(Location);

  readonly TaskFormMode = TaskFormMode;
  readonly InputType = InputType;

  readonly statusOptions: TaskStatusOption[] = Object.values(TaskStatus).map((value) => ({
    value,
    label: TASK_STATUS_LABELS[value],
  }));

  private readonly routeId = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))), {
    initialValue: null,
  });

  /** `tasks/create` has no `:id`; `tasks/update/:id` does. That is the whole mode switch. */
  readonly mode = computed(() =>
    this.routeId() === null ? TaskFormMode.CREATE : TaskFormMode.UPDATE,
  );

  readonly isUpdateMode = computed(() => this.mode() === TaskFormMode.UPDATE);

  readonly taskId = computed(() => {
    const rawId = this.routeId();

    if (rawId === null) {
      return null;
    }

    const parsedId = Number(rawId);

    return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;
  });

  readonly taskResource = rxResource({
    // Undefined params keep the resource idle, so create mode never fetches.
    params: () => this.taskId() ?? undefined,
    stream: ({ params }) => this.taskStore.getTaskById(params),
  });

  /** The deadline the task was loaded with, so editing an already-overdue task stays possible. */
  private readonly originalDeadline = signal<string | null>(null);

  private readonly hasPatchedForm = signal(false);

  readonly form = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, nonBlank, Validators.maxLength(100)]],
    description: ['', [richTextRequired]],
    deadline: ['', [Validators.required, notInPast(this.dateService, this.originalDeadline)]],
    status: [TaskStatus.PENDING, [Validators.required]],
  });

  readonly isSaving = signal(false);

  readonly saveError = signal<string | null>(null);

  readonly isLoadingTask = computed(() => this.isUpdateMode() && this.taskResource.isLoading());

  readonly loadError = computed(() =>
    this.isUpdateMode() ? this.taskResource.error() : undefined,
  );

  readonly isTaskMissing = computed(
    () =>
      this.isUpdateMode() &&
      !this.taskResource.isLoading() &&
      !this.taskResource.error() &&
      this.taskResource.value() === undefined,
  );

  readonly canShowForm = computed(
    () => !this.isLoadingTask() && !this.loadError() && !this.isTaskMissing(),
  );

  readonly pageTitle = computed(() =>
    this.mode() === TaskFormMode.CREATE ? 'New task' : 'Edit task',
  );

  readonly submitLabel = computed(() =>
    this.mode() === TaskFormMode.CREATE ? 'Create task' : 'Save changes',
  );

  constructor() {
    // Fill the form once the task arrives in update mode. Guarded so a resource
    // reload can never overwrite edits already in progress.
    effect(() => {
      // Reading value() on a failed resource throws, so bail on the error first.
      if (this.taskResource.error()) {
        return;
      }

      const task = this.taskResource.value();

      if (!task || untracked(this.hasPatchedForm)) {
        return;
      }

      this.originalDeadline.set(task.deadline);
      this.form.setValue({
        title: task.title,
        description: task.description,
        deadline: task.deadline,
        status: task.status,
      });
      this.hasPatchedForm.set(true);
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      // `appFocusFirstInvalid` also does this and moves focus, but only for a
      // real submit event — keeping it here means a programmatic call still
      // reveals the messages.
      this.form.markAllAsTouched();
      return;
    }

    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.saveError.set(null);

    const draft: TaskDraft = this.form.getRawValue();
    const taskId = this.taskId();

    const save =
      this.isUpdateMode() && taskId !== null
        ? this.taskStore.updateTask(taskId, draft)
        : this.taskStore.createTask(draft);

    // Subscribing is deliberate here: this is a command, not view state. Every
    // result lands in a signal, which is what keeps zoneless rendering correct.
    save.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.router.navigate(['/tasks']);
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.saveError.set(
          error instanceof Error ? error.message : "Couldn't save the task. Please try again.",
        );
      },
    });
  }

  onCancel(): void {
    if (history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/tasks']);
    }
  }
}
