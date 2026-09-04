import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CommonInput } from './common-input';
import { InputType } from './common-input.types';
import { nonBlank } from '../../shared/form.validators';

/** Hosts the field the way a real form does, inside a [formGroup]. */
@Component({
  imports: [ReactiveFormsModule, CommonInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
      <app-common-input
        fieldId="title"
        label="Title"
        hint="Keep it short."
        formControlName="title"
      />
      <app-common-input
        fieldId="notes"
        label="Notes"
        [type]="InputType.TEXTAREA"
        formControlName="notes"
      />
      <button type="submit">Save</button>
    </form>
  `,
})
class HostComponent {
  protected readonly InputType = InputType;

  readonly form = new FormBuilder().nonNullable.group({
    title: ['', [Validators.required, nonBlank, Validators.maxLength(5)]],
    notes: [''],
  });

  onSubmit(): void {}
}

describe('CommonInput', () => {
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
    return fixture.nativeElement.querySelector('#title') as HTMLInputElement;
  }

  function fieldHost(): HTMLElement {
    return input().closest('app-common-input') as HTMLElement;
  }

  function errorText(): string {
    const element = fixture.nativeElement.querySelector('#title-error') as HTMLElement | null;

    return element?.textContent?.trim() ?? '';
  }

  it('labels the control and describes it with its hint and message region', () => {
    const label = fixture.nativeElement.querySelector('label[for="title"]') as HTMLLabelElement;

    expect(label.textContent?.trim()).toBe('Title');
    // The message region is always present, so it is always described — an
    // aria-live region has to exist before its content changes.
    expect(input().getAttribute('aria-describedby')).toBe('title-hint title-error');
    expect(fixture.nativeElement.querySelector('#title-hint')?.textContent?.trim()).toBe(
      'Keep it short.',
    );
  });

  it('says nothing while the field is untouched', () => {
    expect(host.form.controls.title.invalid).toBe(true);
    expect(errorText()).toBe('');
    expect(fieldHost().classList).not.toContain('field--invalid');
    expect(input().getAttribute('aria-invalid')).toBeNull();
  });

  it('takes its wording from the label without the form supplying any', async () => {
    host.form.controls.title.markAsTouched();
    await fixture.whenStable();

    expect(errorText()).toBe('Title is required.');
    expect(fieldHost().classList).toContain('field--invalid');
    expect(input().getAttribute('aria-invalid')).toBe('true');
  });

  it('speaks up after a submit even when the field was never touched', async () => {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(errorText()).toBe('Title is required.');
  });

  it('reports the length rule against the validator, not a copied number', async () => {
    host.form.controls.title.setValue('far too long');
    host.form.controls.title.markAsTouched();
    await fixture.whenStable();

    expect(errorText()).toBe('Title must be 5 characters or fewer.');
  });

  it('clears the treatment once the field becomes valid', async () => {
    host.form.controls.title.markAsTouched();
    await fixture.whenStable();
    expect(errorText()).toBe('Title is required.');

    host.form.controls.title.setValue('Ada');
    await fixture.whenStable();

    expect(errorText()).toBe('');
    expect(fieldHost().classList).not.toContain('field--invalid');
  });

  it('writes a value pushed in by the form', async () => {
    host.form.controls.title.setValue('Ada');
    await fixture.whenStable();

    expect(input().value).toBe('Ada');
  });

  it('propagates an edit back to the bound control', async () => {
    input().value = 'Ada';
    input().dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(host.form.controls.title.value).toBe('Ada');
  });

  it('marks the control touched on blur', async () => {
    expect(host.form.controls.title.touched).toBe(false);

    input().dispatchEvent(new Event('blur'));
    await fixture.whenStable();

    expect(host.form.controls.title.touched).toBe(true);
  });

  it('follows the form when it is disabled', async () => {
    host.form.controls.title.disable();
    await fixture.whenStable();

    expect(input().disabled).toBe(true);
  });

  it('renders a textarea for the textarea type', () => {
    const notes = fixture.nativeElement.querySelector('#notes') as HTMLElement;

    expect(notes.tagName).toBe('TEXTAREA');
  });
});
