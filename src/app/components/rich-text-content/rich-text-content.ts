import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';

import { CommonButton } from '../common-button/common-button';
import { normalizeRichTextHtml } from './rich-text-content.utils';

let uniqueId = 0;

/**
 * Renders rich text produced by `RichTextEditor`, clamped to a default height
 * with a toggle that appears only when the content actually overflows.
 *
 * Usage:
 * ```html
 * <app-rich-text-content [html]="task.description" [contentLabel]="task.title" />
 * ```
 *
 * The clamped content stays in the DOM and readable by assistive tech — the
 * clip is a visual affordance, not a content restriction. That is only safe
 * while the editor offers no link or image control: the moment it does, the
 * clipped region gains focusable children and needs `inert` while collapsed.
 */
@Component({
  selector: 'app-rich-text-content',
  imports: [CommonButton],
  templateUrl: './rich-text-content.html',
  styleUrl: './rich-text-content.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--rich-text-collapsed-height]': 'collapsedHeight()',
  },
})
export class RichTextContent {
  /** Editor HTML to display. Normalised before it reaches the DOM. */
  readonly html = input.required<string>();

  /** Height the content is clamped to while collapsed, as a CSS length. */
  readonly collapsedHeight = input('6rem');

  /**
   * What this content describes, used to disambiguate the toggle for screen
   * reader users when several sit on one page (e.g. the task title).
   */
  readonly contentLabel = input<string | null>(null);

  /** Ties the toggle to the region it controls. */
  protected readonly contentId = `rich-text-content-${uniqueId++}`;

  protected readonly renderedHtml = computed(() => normalizeRichTextHtml(this.html()));

  protected readonly isExpanded = signal(false);
  protected readonly isOverflowing = signal(false);

  protected readonly toggleLabel = computed(() => (this.isExpanded() ? 'Show less' : 'Show more'));

  /**
   * Null when no label was given, so the button falls back to its visible text.
   * The visible text stays a prefix of the accessible name (WCAG 2.5.3).
   */
  protected readonly toggleAccessibleName = computed(() => {
    const contentLabel = this.contentLabel();

    return contentLabel ? `${this.toggleLabel()} of ${contentLabel}` : null;
  });

  /** The clamped wrapper — overflow is measured against this box. */
  private readonly clip = viewChild<ElementRef<HTMLElement>>('clip');

  /**
   * The content itself. It lays out at its full height inside the clamped
   * wrapper, so this is the element whose size actually changes on reflow.
   */
  private readonly body = viewChild<ElementRef<HTMLElement>>('body');

  constructor() {
    effect((onCleanup) => {
      const body = this.body()?.nativeElement;

      // Absent in non-browser test environments; the toggle simply stays hidden.
      if (!body || typeof ResizeObserver === 'undefined') {
        return;
      }

      // Setting a signal from the callback is what makes this visible to
      // zoneless change detection — there is no zone to notice the resize.
      const observer = new ResizeObserver(() => this.measure());
      observer.observe(body);

      onCleanup(() => observer.disconnect());
    });

    // Layout reads belong in the read phase, after Angular has written the DOM.
    afterRenderEffect({
      read: () => {
        // Tracked so a content change, or a collapse, re-measures.
        this.renderedHtml();
        this.isExpanded();

        this.measure();
      },
    });
  }

  protected toggle(): void {
    this.isExpanded.update((isExpanded) => !isExpanded);
  }

  /**
   * Only meaningful while collapsed: expanded, the wrapper is unclamped and
   * reports no overflow. "Show less" is always valid, and the toggle's
   * visibility is rechecked the moment the content collapses again.
   */
  private measure(): void {
    const clip = this.clip()?.nativeElement;

    if (!clip || untracked(this.isExpanded)) {
      return;
    }

    // A pixel of slack: sub-pixel line heights can leave a fractional remainder.
    this.isOverflowing.set(clip.scrollHeight - clip.clientHeight > 1);
  }
}
