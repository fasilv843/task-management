import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  CommonDateInput,
  earliestSelectable,
} from '../../components/common-date-input/common-date-input';
import { CommonBackButton } from '../../components/common-back-button/common-back-button';
import { CommonButton } from '../../components/common-button/common-button';
import { CommonInput } from '../../components/common-input/common-input';
import { CommonSelect } from '../../components/common-select/common-select';
import { ErrorState } from '../../components/error-state/error-state';
import { RichTextEditor } from '../../components/rich-text-editor/rich-text-editor';
import { FocusFirstInvalidDirective } from '../../shared/directives/focus-first-invalid.directive';
import { mobxToSignal } from '../../state/mobx-to-signal';
import { TASK_STATUS_LABELS, TaskDraft, TaskStatus } from '../../services/task.types';
import { nonBlank, notInPast } from '../../shared/form.validators';
import { TaskFormStore } from './task-form.store';
import { TaskStatusOption } from './task-form.types';
import { richTextRequired } from './task-form.validators';

/**
 * The create/update page.
 *
 * The form is this class's responsibility — Reactive Forms is already a state
 * layer, and mirroring it into MobX would give us two copies of the same truth.
 * Everything around the form (which mode, whether the task loaded, what happens
 * on submit, where Cancel goes) lives in `TaskFormStore`, provided here so it
 * is created and destroyed with the page.
 */
@Component({
  selector: 'app-task-form',
  imports: [
    ReactiveFormsModule,
    CommonBackButton,
    CommonButton,
    CommonDateInput,
    CommonInput,
    CommonSelect,
    ErrorState,
    RichTextEditor,
    FocusFirstInvalidDirective,
  ],
  providers: [TaskFormStore],
  templateUrl: './task-form.html',
  styleUrl: './task-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskForm {
  private readonly store = inject(TaskFormStore);
  private readonly formBuilder = inject(FormBuilder);

  readonly statusOptions: TaskStatusOption[] = Object.values(TaskStatus).map((value) => ({
    value,
    label: TASK_STATUS_LABELS[value],
  }));

  private readonly task = mobxToSignal(() => this.store.task);

  readonly isLoadingTask = mobxToSignal(() => this.store.isLoadingTask);
  readonly loadError = mobxToSignal(() => this.store.loadError);
  readonly isTaskMissing = mobxToSignal(() => this.store.isTaskMissing);
  readonly canShowForm = mobxToSignal(() => this.store.canShowForm);
  readonly isSaving = mobxToSignal(() => this.store.isSaving);
  readonly saveError = mobxToSignal(() => this.store.saveError);
  readonly pageTitle = mobxToSignal(() => this.store.pageTitle);
  readonly submitButtonLabel = mobxToSignal(() => this.store.submitButtonLabel);

  /**
   * The deadline the task was loaded with, so editing an already-overdue task
   * stays possible. Null in create mode, which is what makes `notInPast` apply
   * its normal floor there.
   */
  private readonly originalDeadline = computed(() => this.task()?.deadline ?? null);

  /** Keeps the picker's floor in step with `notInPast`, exemption included. */
  readonly minDeadline = computed(() => earliestSelectable(this.originalDeadline()));

  readonly form = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, nonBlank, Validators.maxLength(100)]],
    description: ['', [richTextRequired]],
    deadline: ['', [Validators.required, notInPast(this.originalDeadline)]],
    status: [TaskStatus.PENDING, [Validators.required]],
  });

  private readonly hasPatchedForm = signal(false);

  constructor() {
    // Fill the form once the task arrives in update mode. Guarded so a later
    // store change can never overwrite edits already in progress.
    effect(() => {
      const task = this.task();

      if (!task || untracked(this.hasPatchedForm)) {
        return;
      }

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

    const draft: TaskDraft = this.form.getRawValue();

    // The store decides create vs update and navigates on success; a failure
    // leaves the form up with `saveError` showing.
    void this.store.save(draft);
  }

  onCancel(): void {
    this.store.cancel();
  }

  retryLoad(): void {
    this.store.retryLoad();
  }
}
