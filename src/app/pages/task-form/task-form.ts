import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { RichTextEditor } from '../../components/rich-text-editor/rich-text-editor';
import { FormValidationError } from '../../components/form-validation-error/form-validation-error';
import { isErrorVisible } from '../../components/form-validation-error/form-validation-error.utils';
import { TaskService } from '../../services/task-service';
import { DateService } from '../../services/date-service';
import { TASK_STATUS_LABELS, TaskDraft, TaskStatus } from '../../services/task.types';
import { TaskFormMode, TaskFormValue, TaskStatusOption } from './task-form.types';
import { nonBlank, notInPast, richTextRequired } from './task-form.validators';

@Component({
  selector: 'app-task-form',
  imports: [ReactiveFormsModule, RichTextEditor, FormValidationError],
  templateUrl: './task-form.html',
  styleUrl: './task-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskForm {
  private readonly taskService = inject(TaskService);
  private readonly dateService = inject(DateService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);

  readonly TaskFormMode = TaskFormMode;

  readonly statusOptions: TaskStatusOption[] = Object.values(TaskStatus).map((value) => ({
    value,
    label: TASK_STATUS_LABELS[value],
  }));

  // Held as fields rather than inline template literals so their identities stay
  // stable across change detection.
  readonly titleErrorMessages: Record<string, string> = {
    required: 'Title is required.',
    nonBlank: 'Title is required.',
    maxlength: 'Title must be 100 characters or fewer.',
  };

  readonly descriptionErrorMessages: Record<string, string> = {
    required: 'Description is required.',
  };

  readonly deadlineErrorMessages: Record<string, string> = {
    required: 'Deadline is required.',
    invalidDate: 'Enter a valid date.',
    notInPast: 'Deadline cannot be in the past.',
  };

  readonly statusErrorMessages: Record<string, string> = {
    required: 'Status is required.',
  };

  private readonly descriptionEditor = viewChild(RichTextEditor);

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
    stream: ({ params }) => this.taskService.getTaskById(params),
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

  /**
   * Bridges form state into the signal graph so the invalid input styling tracks
   * it under zoneless. `FormValidationError` keeps its own bridge for messages.
   */
  private readonly formEvents = toSignal(this.form.events, { initialValue: null });

  private readonly wasSubmitted = signal(false);

  readonly isSaving = signal(false);

  readonly saveError = signal<string | null>(null);

  readonly isLoadingTask = computed(() => this.isUpdateMode() && this.taskResource.isLoading());

  readonly loadError = computed(() => (this.isUpdateMode() ? this.taskResource.error() : undefined));

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

  readonly titleHasError = computed(() => this.showsError(this.form.controls.title));

  readonly descriptionHasError = computed(() => this.showsError(this.form.controls.description));

  readonly deadlineHasError = computed(() => this.showsError(this.form.controls.deadline));

  readonly statusHasError = computed(() => this.showsError(this.form.controls.status));

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
    this.wasSubmitted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalidControl();
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
        ? this.taskService.updateTask(taskId, draft)
        : this.taskService.createTask(draft);

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
    this.router.navigate(['/tasks']);
  }

  /** Drives the invalid input styling, following the same rule as the messages. */
  private showsError(control: AbstractControl): boolean {
    // Establishes the dependency that re-runs this computed on any form change.
    this.formEvents();

    return isErrorVisible(control, this.wasSubmitted());
  }

  private focusFirstInvalidControl(): void {
    const fieldOrder: [keyof TaskFormValue, string][] = [
      ['title', 'task-title'],
      ['description', 'task-description'],
      ['deadline', 'task-deadline'],
      ['status', 'task-status'],
    ];

    for (const [controlName, elementId] of fieldOrder) {
      if (!this.form.controls[controlName].invalid) {
        continue;
      }

      if (controlName === 'description') {
        this.descriptionEditor()?.focus();
      } else {
        this.document.getElementById(elementId)?.focus();
      }

      return;
    }
  }
}
