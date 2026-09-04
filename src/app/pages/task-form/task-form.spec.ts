import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { TaskForm } from './task-form';
import { TaskFormMode } from './task-form.types';
import { Task, TaskStatus } from '../../services/task.types';

const existingTask: Task = {
  id: 1,
  title: 'Design authentication flow',
  description: '<p>Design the login flow.</p><ul><li>Define user flow</li></ul>',
  deadline: '2099-01-15',
  status: TaskStatus.COMPLETED,
};

/** Builds the component with the route params the two routes would supply. */
async function setUp(params: Record<string, string>): Promise<ComponentFixture<TaskForm>> {
  await TestBed.configureTestingModule({
    imports: [TaskForm],
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: { paramMap: of(convertToParamMap(params)) },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(TaskForm);
  // Only render here. Awaiting stability would deadlock in update mode, where the
  // task fetch stays pending until the test flushes it.
  fixture.detectChanges();

  return fixture;
}

/** Reads the message rendered by the `app-form-validation-error` with this id. */
function errorTextFor(fixture: ComponentFixture<TaskForm>, fieldId: string): string {
  const host = fixture.nativeElement.querySelector(`#${fieldId}`) as HTMLElement | null;

  return host?.textContent?.trim() ?? '';
}

describe('TaskForm', () => {
  afterEach(() => TestBed.resetTestingModule());

  describe('create mode (tasks/create)', () => {
    it('should create', async () => {
      const fixture = await setUp({});

      expect(fixture.componentInstance).toBeTruthy();
    });

    it('starts in CREATE mode with an empty form defaulted to Pending', async () => {
      const fixture = await setUp({});
      const component = fixture.componentInstance;

      expect(component.mode()).toBe(TaskFormMode.CREATE);
      expect(component.form.getRawValue()).toEqual({
        title: '',
        description: '',
        deadline: '',
        status: TaskStatus.PENDING,
      });
    });

    it('does not fetch a task', async () => {
      await setUp({});

      TestBed.inject(HttpTestingController).expectNone('assets/tasks.json');
    });

    it('reports required fields only after a submit attempt', async () => {
      const fixture = await setUp({});
      const component = fixture.componentInstance;

      expect(errorTextFor(fixture, 'task-title-error')).toBe('');

      component.onSubmit();
      await fixture.whenStable();

      expect(errorTextFor(fixture, 'task-title-error')).toBe('Title is required.');
      expect(errorTextFor(fixture, 'task-description-error')).toBe('Description is required.');
      expect(errorTextFor(fixture, 'task-deadline-error')).toBe('Deadline is required.');
    });

    it('marks the invalid inputs for assistive tech after a submit attempt', async () => {
      const fixture = await setUp({});

      fixture.componentInstance.onSubmit();
      await fixture.whenStable();

      const titleInput = fixture.nativeElement.querySelector('#task-title') as HTMLInputElement;
      expect(titleInput.getAttribute('aria-invalid')).toBe('true');
      expect(titleInput.getAttribute('aria-describedby')).toBe('task-title-error');
    });

    it('rejects a deadline in the past', async () => {
      const fixture = await setUp({});
      const component = fixture.componentInstance;

      component.form.controls.deadline.setValue('2000-01-01');
      component.form.controls.deadline.markAsTouched();
      await fixture.whenStable();

      expect(errorTextFor(fixture, 'task-deadline-error')).toBe('Deadline cannot be in the past.');
    });

    it('treats an empty rich text value as missing', async () => {
      const fixture = await setUp({});
      const component = fixture.componentInstance;

      // What Quill reports for a visually empty editor.
      component.form.controls.description.setValue('<p><br></p>');
      component.form.controls.description.markAsTouched();
      await fixture.whenStable();

      expect(errorTextFor(fixture, 'task-description-error')).toBe('Description is required.');
    });
  });

  describe('update mode (tasks/update/:id)', () => {
    it('pre-fills the form from the loaded task', async () => {
      const fixture = await setUp({ id: '1' });
      const component = fixture.componentInstance;

      expect(component.mode()).toBe(TaskFormMode.UPDATE);

      TestBed.inject(HttpTestingController)
        .expectOne('assets/tasks.json')
        .flush([existingTask]);
      await fixture.whenStable();

      expect(component.form.getRawValue()).toEqual({
        title: existingTask.title,
        description: existingTask.description,
        deadline: existingTask.deadline,
        status: existingTask.status,
      });
    });

    it('keeps an already-overdue deadline valid so the task can still be edited', async () => {
      const fixture = await setUp({ id: '1' });
      const component = fixture.componentInstance;

      TestBed.inject(HttpTestingController)
        .expectOne('assets/tasks.json')
        .flush([{ ...existingTask, deadline: '2000-01-01' }]);
      await fixture.whenStable();

      expect(component.form.controls.deadline.valid).toBe(true);

      // A different past date is still rejected.
      component.form.controls.deadline.setValue('2000-06-01');
      expect(component.form.controls.deadline.valid).toBe(false);
    });

    it('reports a missing task rather than showing an empty form', async () => {
      const fixture = await setUp({ id: '999' });
      const component = fixture.componentInstance;

      TestBed.inject(HttpTestingController).expectOne('assets/tasks.json').flush([existingTask]);
      await fixture.whenStable();

      expect(component.isTaskMissing()).toBe(true);
      expect(component.canShowForm()).toBe(false);
    });

    it('surfaces a load failure with the form hidden', async () => {
      const fixture = await setUp({ id: '1' });
      const component = fixture.componentInstance;

      TestBed.inject(HttpTestingController)
        .expectOne('assets/tasks.json')
        .error(new ProgressEvent('network error'));
      await fixture.whenStable();

      expect(component.loadError()).toBeTruthy();
      expect(component.canShowForm()).toBe(false);
    });
  });
});
