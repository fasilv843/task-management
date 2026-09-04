import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { FocusFirstInvalidDirective } from './focus-first-invalid.directive';
import { CommonInput } from '../../components/common-input/common-input';

@Component({
  imports: [ReactiveFormsModule, CommonInput, FocusFirstInvalidDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" appFocusFirstInvalid novalidate>
      <app-common-input fieldId="first" label="First" formControlName="first" />
      <app-common-input fieldId="second" label="Second" formControlName="second" />
      <app-common-input fieldId="third" label="Third" formControlName="third" />
      <button type="submit">Save</button>
    </form>
  `,
})
class HostComponent {
  readonly form = new FormBuilder().nonNullable.group({
    first: ['', [Validators.required]],
    second: ['', [Validators.required]],
    third: ['', [Validators.required]],
  });
}

describe('FocusFirstInvalidDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    // Focus only lands on an element that is actually in the document.
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
  });

  afterEach(() => fixture.nativeElement.remove());

  async function submit(): Promise<void> {
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(
      new Event('submit'),
    );
    await fixture.whenStable();
  }

  it('focuses the first invalid field in reading order', async () => {
    await submit();

    expect(document.activeElement?.id).toBe('first');
  });

  it('skips fields that are already filled in', async () => {
    host.form.controls.first.setValue('done');
    await fixture.whenStable();

    await submit();

    expect(document.activeElement?.id).toBe('second');
  });

  it('reveals every message, so the field it focuses is not the only one explained', async () => {
    await submit();

    expect(host.form.controls.third.touched).toBe(true);
    expect(
      (fixture.nativeElement.querySelector('#third-error') as HTMLElement).textContent?.trim(),
    ).toBe('Third is required.');
  });

  it('leaves focus alone when the form is valid', async () => {
    host.form.setValue({ first: 'a', second: 'b', third: 'c' });
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.focus();

    await submit();

    expect(document.activeElement).toBe(button);
  });
});
