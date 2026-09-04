import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { FormValidationError } from './form-validation-error';

/** Hosts the component the way a real form does, inside a [formGroup]. */
@Component({
  imports: [ReactiveFormsModule, FormValidationError],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="submitted.set(true)">
      <input id="name" type="text" formControlName="name" />
      <app-form-validation-error
        fieldId="name-error"
        [control]="form.controls.name"
        [messages]="messages"
      />
      <button type="submit">Save</button>
    </form>
  `,
})
class HostComponent {
  private readonly formBuilder = new FormBuilder();

  readonly submitted = signal(false);

  readonly messages: Record<string, string> = {
    required: 'Name is required.',
    maxlength: 'Name is too long.',
  };

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(5)]],
  });
}

describe('FormValidationError', () => {
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

  function errorElement(): HTMLElement {
    return fixture.nativeElement.querySelector('#name-error') as HTMLElement;
  }

  function errorText(): string {
    return errorElement().textContent?.trim() ?? '';
  }

  it('stays silent while the field is untouched', () => {
    expect(host.form.controls.name.invalid).toBe(true);
    expect(errorText()).toBe('');
    expect(errorElement().classList).not.toContain('form-validation-error--visible');
  });

  it('keeps the live region in the DOM so the message can be announced', () => {
    // A live region added at the same time as its content announces nothing.
    expect(errorElement()).toBeTruthy();
    expect(errorElement().getAttribute('aria-live')).toBe('polite');
  });

  it('shows the message once the field is touched', async () => {
    host.form.controls.name.markAsTouched();
    await fixture.whenStable();

    expect(errorText()).toBe('Name is required.');
    expect(errorElement().classList).toContain('form-validation-error--visible');
  });

  it('shows the message after submit even when the field was never touched', async () => {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(host.form.controls.name.touched).toBe(false);
    expect(errorText()).toBe('Name is required.');
  });

  it('clears the message once the field becomes valid', async () => {
    host.form.controls.name.markAsTouched();
    await fixture.whenStable();
    expect(errorText()).toBe('Name is required.');

    host.form.controls.name.setValue('Ada');
    await fixture.whenStable();

    expect(errorText()).toBe('');
    expect(errorElement().classList).not.toContain('form-validation-error--visible');
  });

  it('picks the message matching the active error', async () => {
    host.form.controls.name.setValue('far too long');
    host.form.controls.name.markAsTouched();
    await fixture.whenStable();

    expect(errorText()).toBe('Name is too long.');
  });

  it('renders nothing for an error key it has no message for', async () => {
    host.form.controls.name.setErrors({ somethingElse: true });
    host.form.controls.name.markAsTouched();
    await fixture.whenStable();

    expect(errorText()).toBe('');
  });
});
