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
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { QuillEditorComponent } from 'ngx-quill';

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
 *   formControlName="description"
 *   [controls]="[RichTextControl.BOLD, RichTextControl.BULLET_LIST]"
 *   [invalid]="showsError()"
 *   labelledBy="description-label"
 *   placeholder="Describe the task…"
 * />
 * ```
 *
 * Nothing about the underlying editor library leaks to callers, so it can be
 * swapped without touching consumers.
 */
@Component({
  selector: 'app-rich-text-editor',
  imports: [ReactiveFormsModule, QuillEditorComponent],
  templateUrl: './rich-text-editor.html',
  styleUrl: './rich-text-editor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--rich-text-editor-min-height]': 'minHeight()',
    '[class.rich-text-editor--invalid]': 'invalid()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditor),
      multi: true,
    },
  ],
})
export class RichTextEditor implements ControlValueAccessor {
  private readonly destroyRef = inject(DestroyRef);

  /** Formatting buttons to offer, in the order given. */
  readonly controls = input<readonly RichTextControl[]>(DEFAULT_RICH_TEXT_CONTROLS);

  readonly placeholder = input('');

  /** Minimum height of the editing area, as a CSS length. */
  readonly minHeight = input('11rem');

  /** Id of the element labelling this editor. */
  readonly labelledBy = input<string | null>(null);

  /** Id of the element describing this editor, typically its validation message. */
  readonly describedBy = input<string | null>(null);

  /** Renders the error treatment and exposes `aria-invalid` to assistive tech. */
  readonly invalid = input(false);

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

  private onTouched: () => void = () => {};

  constructor() {
    // Mirrored onto the editor body rather than bound in the template: the
    // contenteditable is built by the editor, outside this component's view.
    effect(() => {
      const editorRoot = this.editorRoot();

      if (!editorRoot) {
        return;
      }

      if (this.invalid()) {
        editorRoot.setAttribute('aria-invalid', 'true');
      } else {
        editorRoot.removeAttribute('aria-invalid');
      }
    });

    effect(() => {
      const editorRoot = this.editorRoot();
      const labelledBy = this.labelledBy();
      const describedBy = this.describedBy();

      if (!editorRoot) {
        return;
      }

      this.applyAttribute(editorRoot, 'aria-labelledby', labelledBy);
      this.applyAttribute(editorRoot, 'aria-describedby', describedBy);
    });
  }

  /** Moves focus into the editing area. */
  focus(): void {
    this.editorRoot()?.focus();
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

  writeValue(value: string | null): void {
    // emitEvent: false — this is the form pushing a value in, not a user edit.
    this.innerControl.setValue(value ?? '', { emitEvent: false });
  }

  registerOnChange(onChange: (value: string | null) => void): void {
    this.innerControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => onChange(value));
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.innerControl.disable({ emitEvent: false });
    } else {
      this.innerControl.enable({ emitEvent: false });
    }
  }

  private applyAttribute(element: HTMLElement, name: string, value: string | null): void {
    if (value) {
      element.setAttribute(name, value);
    } else {
      element.removeAttribute(name);
    }
  }
}
