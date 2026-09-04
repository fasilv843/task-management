import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { QuillEditorComponent } from 'ngx-quill';

import { FormField } from '../form-field/form-field';
import { BaseFormControl } from '../../shared/base-form-control';
import { FocusableFormField } from '../../shared/focusable-form-field';
import { InvalidFieldDirective } from '../../shared/directives/invalid-field.directive';
import {
  DEFAULT_RICH_TEXT_CONTROLS,
  RICH_TEXT_CONTROL_CONFIG,
  RICH_TEXT_CONTROL_LABELS,
  RichTextControl,
} from './rich-text-editor.types';

/**
 * Reactive-forms rich text input.
 *
 * Usage:
 * ```html
 * <app-rich-text-editor
 *   label="Description"
 *   formControlName="description"
 *   [controls]="[RichTextControl.BOLD, RichTextControl.BULLET_LIST]"
 *   placeholder="Describe the task…"
 * />
 * ```
 *
 * Nothing about the underlying editor library leaks to callers, so it can be
 * swapped without touching consumers. Label, message and error treatment are
 * inherited from `BaseFormControl`, so it behaves like every other field.
 */
@Component({
  selector: 'app-rich-text-editor',
  imports: [ReactiveFormsModule, QuillEditorComponent, FormField],
  templateUrl: './rich-text-editor.html',
  styleUrl: './rich-text-editor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [InvalidFieldDirective],
  providers: [{ provide: FocusableFormField, useExisting: forwardRef(() => RichTextEditor) }],
  host: {
    '[style.--rich-text-editor-min-height]': 'minHeight()',
  },
})
export class RichTextEditor extends BaseFormControl<string> {
  private readonly destroyRef = inject(DestroyRef);

  /** Formatting buttons to offer, in the order given. */
  readonly controls = input<readonly RichTextControl[]>(DEFAULT_RICH_TEXT_CONTROLS);

  readonly placeholder = input('');

  /** Minimum height of the editing area, as a CSS length. */
  readonly minHeight = input('11rem');

  readonly controlLabels = RICH_TEXT_CONTROL_LABELS;
  readonly controlConfig = RICH_TEXT_CONTROL_CONFIG;

  /**
   * The editor exposes no value input of its own, so its own value accessor is
   * driven through this inner control. Kept fully internal.
   */
  protected readonly innerControl = new FormControl<string | null>('');

  /** Only the formats the toolbar offers are accepted, pasted content included. */
  protected readonly allowedFormats = computed(() =>
    this.controls()
      .map((control) => RICH_TEXT_CONTROL_CONFIG[control].format)
      .filter((format): format is string => format !== null),
  );

  private readonly editorRoot = signal<HTMLElement | null>(null);

  constructor() {
    super();

    // Mirrored onto the editor body rather than bound in the template: the
    // contenteditable is built by the editor, outside this component's view.
    effect(() => {
      const editorRoot = this.editorRoot();

      if (!editorRoot) {
        return;
      }

      this.applyAttribute(editorRoot, 'aria-invalid', this.hasError() ? 'true' : null);
    });

    effect(() => {
      const editorRoot = this.editorRoot();

      if (!editorRoot) {
        return;
      }

      this.applyAttribute(editorRoot, 'aria-labelledby', this.labelId());
      this.applyAttribute(editorRoot, 'aria-describedby', this.describedBy());
    });
  }

  /** Moves focus into the editing area. */
  focus(): void {
    this.editorRoot()?.focus();
  }

  override writeValue(value: string | null): void {
    super.writeValue(value);

    // emitEvent: false — this is the form pushing a value in, not a user edit.
    this.innerControl.setValue(value ?? '', { emitEvent: false });
  }

  override registerOnChange(onChange: (value: string | null) => void): void {
    super.registerOnChange(onChange);

    this.innerControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => onChange(value));
  }

  override setDisabledState(isDisabled: boolean): void {
    super.setDisabledState(isDisabled);

    if (isDisabled) {
      this.innerControl.disable({ emitEvent: false });
    } else {
      this.innerControl.enable({ emitEvent: false });
    }
  }

  protected onEditorCreated(editor: { root: HTMLElement }): void {
    // The editor does not forward a role or accessible name to its
    // contenteditable, so they are set on the editor body directly.
    editor.root.setAttribute('role', 'textbox');
    editor.root.setAttribute('aria-multiline', 'true');

    this.editorRoot.set(editor.root);
  }

  protected onEditorBlur(): void {
    this.onTouched();
  }

  private applyAttribute(element: HTMLElement, name: string, value: string | null): void {
    if (value) {
      element.setAttribute(name, value);
    } else {
      element.removeAttribute(name);
    }
  }
}
