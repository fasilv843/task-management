import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { StatusTone } from './common-status.types';

/**
 * The app's one status chip — a coloured dot plus a label, used anywhere a
 * closed-set state (task status, and any future one) needs to read as itself
 * at a glance. Colour is chosen entirely through `tone`, drawn from the same
 * intent palette (warning/info/success/danger) as buttons and banners; the
 * label always renders alongside it so colour is never the only carrier of
 * meaning.
 *
 * Usage:
 *   <app-common-status [tone]="StatusTone.Warning" label="Pending" />
 */
@Component({
  selector: 'app-common-status',
  imports: [],
  templateUrl: './common-status.html',
  styleUrl: './common-status.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
})
export class CommonStatus {
  readonly tone = input.required<StatusTone>();
  readonly label = input.required<string>();

  protected readonly classes = computed(() => `status status--${this.tone()}`);
}
