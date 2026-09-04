import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CommonSelect } from './common-select';
import { SelectOption } from './common-select.types';

@Component({
  imports: [ReactiveFormsModule, CommonSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" novalidate>
      <app-common-select
        fieldId="status"
        label="Status"
        placeholder="Choose a status"
        [options]="options"
        formControlName="status"
      />
    </form>
  `,
})
class HostComponent {
  readonly options: SelectOption[] = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'DONE', label: 'Completed' },
  ];

  readonly form = new FormBuilder().nonNullable.group({
    status: ['', [Validators.required]],
  });
}

describe('CommonSelect', () => {
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

  function select(): HTMLSelectElement {
    return fixture.nativeElement.querySelector('#status') as HTMLSelectElement;
  }

  function errorText(): string {
    const element = fixture.nativeElement.querySelector('#status-error') as HTMLElement | null;

    return element?.textContent?.trim() ?? '';
  }

  it('renders the placeholder ahead of the options', () => {
    const labels = Array.from(select().options).map((option) => option.textContent?.trim());

    expect(labels).toEqual(['Choose a status', 'Pending', 'Completed']);
  });

  it('shows the value the form holds', async () => {
    host.form.controls.status.setValue('DONE');
    await fixture.whenStable();

    expect(select().value).toBe('DONE');
  });

  it('propagates a choice back to the bound control', async () => {
    select().value = 'PENDING';
    select().dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(host.form.controls.status.value).toBe('PENDING');
  });

  it('takes its wording from the label, like every other field', async () => {
    host.form.controls.status.markAsTouched();
    await fixture.whenStable();

    expect(errorText()).toBe('Status is required.');
    expect(select().getAttribute('aria-invalid')).toBe('true');
    expect((select().closest('app-common-select') as HTMLElement).classList).toContain(
      'field--invalid',
    );
  });

  it('follows the form when it is disabled', async () => {
    host.form.controls.status.disable();
    await fixture.whenStable();

    expect(select().disabled).toBe(true);
  });
});
