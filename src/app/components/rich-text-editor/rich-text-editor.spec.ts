import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { RichTextEditor } from './rich-text-editor';
import { RichTextControl } from './rich-text-editor.types';

@Component({
  imports: [ReactiveFormsModule, RichTextEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-rich-text-editor label="Description" [formControl]="description" [controls]="controls" />
  `,
})
class HostComponent {
  readonly description = new FormControl<string | null>('');
  controls: readonly RichTextControl[] = [
    RichTextControl.BOLD,
    RichTextControl.ITALIC,
    RichTextControl.UNDERLINE,
    RichTextControl.BULLET_LIST,
  ];
}

describe('RichTextEditor', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let editor: RichTextEditor;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    await fixture.whenStable();

    editor = fixture.debugElement.children[0].componentInstance as RichTextEditor;
  });

  it('renders a labelled button per requested control', () => {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('[quill-editor-toolbar] button'),
    ) as HTMLButtonElement[];

    expect(buttons.length).toBe(4);
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Bold',
      'Italic',
      'Underline',
      'Bullet list',
    ]);
  });

  it('gives every toolbar button an accessible name', () => {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('[quill-editor-toolbar] button'),
    ) as HTMLButtonElement[];

    // The stock toolbar ships unlabelled buttons, which fails AXE.
    expect(buttons.every((button) => !!button.getAttribute('aria-label'))).toBe(true);
  });

  it('distinguishes list variants by value so both can coexist', async () => {
    host.controls = [RichTextControl.BULLET_LIST, RichTextControl.ORDERED_LIST];
    fixture.detectChanges();
    await fixture.whenStable();

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('[quill-editor-toolbar] button'),
    ) as HTMLButtonElement[];

    expect(buttons.map((button) => button.getAttribute('value'))).toEqual(['bullet', 'ordered']);
  });

  it('writes a value pushed in by the form', () => {
    host.description.setValue('<p>From the form</p>');

    expect(editor['innerControl'].value).toBe('<p>From the form</p>');
  });

  it('normalises a null from the form to an empty value', () => {
    host.description.setValue(null);

    expect(editor['innerControl'].value).toBe('');
  });

  it('propagates an edit back to the bound control', () => {
    editor['innerControl'].setValue('<p>Typed by the user</p>');

    expect(host.description.value).toBe('<p>Typed by the user</p>');
  });

  it('does not echo a form-driven write back as a user edit', () => {
    let changeCount = 0;
    host.description.valueChanges.subscribe(() => changeCount++);

    editor.writeValue('<p>Programmatic</p>');

    expect(changeCount).toBe(0);
  });

  it('disables and re-enables the inner control with the form', () => {
    host.description.disable();
    expect(editor['innerControl'].disabled).toBe(true);

    host.description.enable();
    expect(editor['innerControl'].disabled).toBe(false);
  });

  it('marks the control touched when the editor is blurred', () => {
    expect(host.description.touched).toBe(false);

    editor['onEditorBlur']();

    expect(host.description.touched).toBe(true);
  });

  it('exposes only the formats its toolbar offers', () => {
    expect(editor['allowedFormats']()).toEqual(['bold', 'italic', 'underline', 'list']);
  });

  it('drops formats for controls that apply none', async () => {
    host.controls = [RichTextControl.BOLD, RichTextControl.CLEAN];
    fixture.detectChanges();
    await fixture.whenStable();

    expect(editor['allowedFormats']()).toEqual(['bold']);
  });
});
