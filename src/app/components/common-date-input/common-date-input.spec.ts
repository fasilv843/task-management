import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CommonDateInput, earliestSelectable } from './common-date-input';
import { notInPast } from '../../shared/form.validators';
import { formatDateOnly, startOfToday, todayDateOnly } from '../../utils/date.utils';

/** Hosts the field the way the task form does, inside a [formGroup]. */
@Component({
  imports: [ReactiveFormsModule, CommonDateInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" novalidate>
      <app-common-date-input
        fieldId="deadline"
        label="Deadline"
        formControlName="deadline"
        [min]="min"
      />
    </form>
  `,
})
class HostComponent {
  readonly min = todayDateOnly();

  readonly form = new FormBuilder().nonNullable.group({
    deadline: ['', [Validators.required, notInPast()]],
  });
}

describe('CommonDateInput', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  function input(): HTMLInputElement {
    return fixture.nativeElement.querySelector('#deadline') as HTMLInputElement;
  }

  function errorText(): string {
    const element = fixture.nativeElement.querySelector('#deadline-error') as HTMLElement | null;

    return element?.textContent?.trim() ?? '';
  }

  it('renders a native date control the label points at', () => {
    const label = fixture.nativeElement.querySelector('label[for="deadline"]') as HTMLLabelElement;

    expect(input().type).toBe('date');
    expect(label.textContent?.trim()).toBe('Deadline');
    expect(input().getAttribute('aria-describedby')).toBe('deadline-error');
  });

  it('puts the boundary on the control, so the picker refuses what the validator would', () => {
    expect(input().getAttribute('min')).toBe(todayDateOnly());
  });

  it('propagates an edit back to the bound control', async () => {
    input().value = '2030-01-01';
    input().dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(host.form.controls.deadline.value).toBe('2030-01-01');
  });

  it('writes a value pushed in by the form', async () => {
    host.form.controls.deadline.setValue('2030-01-01');
    await fixture.whenStable();

    expect(input().value).toBe('2030-01-01');
  });

  it('says nothing while the field is untouched', () => {
    expect(host.form.controls.deadline.invalid).toBe(true);
    expect(errorText()).toBe('');
    expect(input().getAttribute('aria-invalid')).toBeNull();
  });

  it('names the earliest acceptable date rather than restating the rule', async () => {
    host.form.controls.deadline.setValue('2000-01-01');
    host.form.controls.deadline.markAsTouched();
    await fixture.whenStable();

    expect(errorText()).toMatch(/^Deadline cannot be earlier than .+\.$/);
    expect(input().getAttribute('aria-invalid')).toBe('true');
  });

  it('clears the treatment once a valid date is chosen', async () => {
    host.form.controls.deadline.setValue('2000-01-01');
    host.form.controls.deadline.markAsTouched();
    await fixture.whenStable();
    expect(errorText()).not.toBe('');

    host.form.controls.deadline.setValue('2030-01-01');
    await fixture.whenStable();

    expect(errorText()).toBe('');
  });

  it('follows the form when it is disabled', async () => {
    host.form.controls.deadline.disable();
    await fixture.whenStable();

    expect(input().disabled).toBe(true);
  });
});

describe('earliestSelectable', () => {
  it('floors at today when there is nothing exempt', () => {
    expect(earliestSelectable(null)).toBe(todayDateOnly());
  });

  it('keeps an already-stored past date reachable', () => {
    expect(earliestSelectable('2000-01-01')).toBe('2000-01-01');
  });

  it('ignores an exempt date that is not in the past', () => {
    const today = startOfToday();
    const tomorrow = formatDateOnly(
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
    );

    expect(earliestSelectable(tomorrow)).toBe(todayDateOnly());
  });
});
