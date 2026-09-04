/**
 * Formatting controls a `RichTextEditor` can offer. The values double as the
 * editor's format names, so a control that is not in the toolbar is also not
 * accepted from pasted content.
 */
export enum RichTextControl {
  BOLD = 'bold',
  ITALIC = 'italic',
  UNDERLINE = 'underline',
  BULLET_LIST = 'bullet',
  ORDERED_LIST = 'ordered',
  CLEAN = 'clean',
}

/** Accessible names for the toolbar buttons, which ship without one by default. */
export const RICH_TEXT_CONTROL_LABELS: Record<RichTextControl, string> = {
  [RichTextControl.BOLD]: 'Bold',
  [RichTextControl.ITALIC]: 'Italic',
  [RichTextControl.UNDERLINE]: 'Underline',
  [RichTextControl.BULLET_LIST]: 'Bullet list',
  [RichTextControl.ORDERED_LIST]: 'Numbered list',
  [RichTextControl.CLEAN]: 'Remove formatting',
};

export const DEFAULT_RICH_TEXT_CONTROLS: readonly RichTextControl[] = [
  RichTextControl.BOLD,
  RichTextControl.ITALIC,
  RichTextControl.UNDERLINE,
  RichTextControl.BULLET_LIST,
  RichTextControl.CLEAN,
];

/**
 * How each control maps onto the underlying editor: the CSS class that renders
 * the button, the optional value it applies, and the format it toggles.
 *
 * `CLEAN` has no format of its own — it strips the others — so it contributes
 * nothing to the allowed format list.
 */
export const RICH_TEXT_CONTROL_CONFIG: Record<
  RichTextControl,
  { buttonClass: string; value: string | null; format: string | null }
> = {
  [RichTextControl.BOLD]: { buttonClass: 'ql-bold', value: null, format: 'bold' },
  [RichTextControl.ITALIC]: { buttonClass: 'ql-italic', value: null, format: 'italic' },
  [RichTextControl.UNDERLINE]: { buttonClass: 'ql-underline', value: null, format: 'underline' },
  [RichTextControl.BULLET_LIST]: { buttonClass: 'ql-list', value: 'bullet', format: 'list' },
  [RichTextControl.ORDERED_LIST]: { buttonClass: 'ql-list', value: 'ordered', format: 'list' },
  [RichTextControl.CLEAN]: { buttonClass: 'ql-clean', value: null, format: null },
};
