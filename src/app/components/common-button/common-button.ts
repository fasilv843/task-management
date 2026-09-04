import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';

export type ButtonVariant = 'filled' | 'outline' | 'subtle' | 'link';
export type ButtonTone = 'default' | 'danger';
export type ButtonSize = 'sm' | 'md';

/**
 * CommonButton
 *
 * The one button component in the app, so every button shares the same shape,
 * spacing, and interaction states. The look is chosen entirely through the
 * `variant`, `tone`, and `size` inputs — there are no per-page overrides. The
 * classes themselves live in common-button.css, built with Tailwind `@apply`.
 *
 * Variants: `filled` (primary), `outline` (secondary, inverts on hover),
 * `subtle` (quiet box for a Cancel next to a filled action), `link` (reads as
 * text; takes no size, inheriting font-size from its surroundings instead).
 *
 * Usage:
 *   <app-common-button label="New task" (buttonClick)="addTask()" />
 *   <app-common-button label="Retry" variant="outline" (buttonClick)="reload()" />
 *   <app-common-button label="View" variant="link" [ariaLabel]="'View ' + task.title" (buttonClick)="view(task)" />
 *   <app-common-button label="Delete" variant="link" tone="danger" [ariaLabel]="'Delete ' + task.title" (buttonClick)="del(task)" />
 *
 *   <!-- icon is still optional, via content projection -->
 *   <app-common-button label="New task" (buttonClick)="addTask()">
 *     <mat-icon icon>add</mat-icon>
 *   </app-common-button>
 *
 * Layout and typography belong on the host element, not on the inner button:
 * `<app-common-button class="mt-4 shrink-0" …/>`. The host is `inline-flex`, so
 * margins apply to it, and font-size/font-family inherit through to the button.
 *
 * The parent listens on (buttonClick), not the native (click), so the
 * component controls exactly when a click counts — e.g. it's ignored while
 * disabled even in edge cases the native `disabled` attribute alone
 * wouldn't cover (e.g. clicks that land on inner content mid re-render).
 * A `type="submit"` button still submits its form natively; no handler needed.
 */
@Component({
  selector: 'app-common-button',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './common-button.html',
  styleUrl: './common-button.css',
  host: { class: 'inline-flex' },
})
export class CommonButton {
  readonly variant = input<ButtonVariant>('filled');
  readonly tone = input<ButtonTone>('default');
  readonly size = input<ButtonSize>('md');
  readonly disabled = input<boolean>(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly ariaLabel = input<string | null>();
  /** For buttons that disclose something — pairs with `ariaControls`. */
  readonly ariaExpanded = input<boolean>();
  /** Id of the region this button expands or collapses. */
  readonly ariaControls = input<string>();
  readonly label = input<string>('');

  readonly buttonClick = output<MouseEvent>();

  private readonly buttonRef = viewChild.required<ElementRef<HTMLButtonElement>>('button');

  protected readonly classes = computed(() => {
    const parts = ['btn', `btn--${this.variant()}`];

    if (this.variant() !== 'link') {
      parts.push(`btn--${this.size()}`);
    }

    if (this.tone() !== 'default') {
      parts.push(`btn--${this.tone()}`);
    }

    return parts.join(' ');
  });

  /** Moves focus to the button — for callers restoring focus after a dialog or inline form closes. */
  focus(): void {
    this.buttonRef().nativeElement.focus();
  }

  protected onClick(event: MouseEvent): void {
    if (this.disabled()) {
      return;
    }
    this.buttonClick.emit(event);
  }
}
