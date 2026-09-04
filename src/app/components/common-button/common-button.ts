import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type ButtonVariant = 'filled' | 'outline' | 'link';
export type ButtonTone = 'default' | 'danger';
export type ButtonSize = 'sm' | 'md';

/**
 * CommonButton
 *
 * A single button component used everywhere in the app so every button
 * shares the same shape, spacing, and interaction states. Look is adapted
 * purely through the `variant` and `tone` inputs — no per-page overrides.
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
 * The parent listens on (buttonClick), not the native (click), so the
 * component controls exactly when a click counts — e.g. it's ignored while
 * disabled even in edge cases the native `disabled` attribute alone
 * wouldn't cover (e.g. clicks that land on inner content mid re-render).
 */
@Component({
  selector: 'app-common-button',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './common-button.html',
  styleUrl: './common-button.css',
})
export class CommonButton {
  readonly variant = input<ButtonVariant>('filled');
  readonly tone = input<ButtonTone>('default');
  readonly size = input<ButtonSize>('md');
  readonly disabled = input<boolean>(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly ariaLabel = input<string>();
  readonly label = input<string>('');

  readonly buttonClick = output<MouseEvent>();

  onClick(event: MouseEvent): void {
    if (this.disabled()) {
      return;
    }
    this.buttonClick.emit(event);
  }

  private static readonly SIZE: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };

  // Full, literal class strings per variant+tone so Tailwind's JIT scanner
  // can find them (dynamically concatenated class names won't be picked up).
  private static readonly VARIANT: Record<ButtonVariant, Record<ButtonTone, string>> = {
    filled: {
      default:
        'border border-ink bg-ink text-paper hover:bg-paper hover:text-ink',
      danger:
        'border border-status-overdue-ink bg-status-overdue-ink text-paper hover:bg-paper hover:text-status-overdue-ink',
    },
    outline: {
      default:
        'border border-ink bg-transparent text-ink hover:bg-ink hover:text-paper',
      danger:
        'border border-status-overdue-ink bg-transparent text-status-overdue-ink hover:bg-status-overdue-ink hover:text-paper',
    },
    link: {
      default: 'border-0 bg-transparent text-ink underline-offset-2 hover:underline',
      danger:
        'border-0 bg-transparent text-status-overdue-ink underline-offset-2 hover:underline',
    },
  };

  get classes(): string {
    const base =
      'inline-flex items-center justify-center gap-1.5 cursor-pointer font-medium ' +
      'transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ' +
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
      'focus-visible:outline-accent';

    const sizing = this.variant() === 'link' ? '' : CommonButton.SIZE[this.size()];
    const look = CommonButton.VARIANT[this.variant()][this.tone()];

    return `${base} ${sizing} ${look}`.replace(/\s+/g, ' ').trim();
  }
}