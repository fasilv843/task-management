/**
 * Formatting controls a `RichTextEditor` can offer. The values double as the
 * editor's format names, so a control that is not in the toolbar is also not
 * accepted from pasted content.
 */
export enum RichTextControl {
  BOLD = 'bold',
  ITALIC = 'italic',
  UNDERLINE = 'underline',
  STRIKETHROUGH = 'strike',
  INLINE_CODE = 'code',
  SUBSCRIPT = 'sub',
  SUPERSCRIPT = 'super',
  BULLET_LIST = 'bullet',
  ORDERED_LIST = 'ordered',
  CHECK_LIST = 'check',
  INDENT = 'indent',
  OUTDENT = 'outdent',
  BLOCKQUOTE = 'blockquote',
  CODE_BLOCK = 'code-block',
  HEADER = 'header',
  SIZE = 'size',
  FONT = 'font',
  COLOR = 'color',
  BACKGROUND = 'background',
  ALIGN = 'align',
  DIRECTION = 'direction',
  LINK = 'link',
  IMAGE = 'image',
  VIDEO = 'video',
  FORMULA = 'formula',
  CLEAN = 'clean',
}

/** Accessible names for the toolbar buttons, which ship without one by default. */
export const RICH_TEXT_CONTROL_LABELS: Record<RichTextControl, string> = {
  [RichTextControl.BOLD]: 'Bold',
  [RichTextControl.ITALIC]: 'Italic',
  [RichTextControl.UNDERLINE]: 'Underline',
  [RichTextControl.STRIKETHROUGH]: 'Strikethrough',
  [RichTextControl.INLINE_CODE]: 'Inline code',
  [RichTextControl.SUBSCRIPT]: 'Subscript',
  [RichTextControl.SUPERSCRIPT]: 'Superscript',
  [RichTextControl.BULLET_LIST]: 'Bullet list',
  [RichTextControl.ORDERED_LIST]: 'Numbered list',
  [RichTextControl.CHECK_LIST]: 'Checklist',
  [RichTextControl.INDENT]: 'Increase indent',
  [RichTextControl.OUTDENT]: 'Decrease indent',
  [RichTextControl.BLOCKQUOTE]: 'Blockquote',
  [RichTextControl.CODE_BLOCK]: 'Code block',
  [RichTextControl.HEADER]: 'Heading level',
  [RichTextControl.SIZE]: 'Font size',
  [RichTextControl.FONT]: 'Font family',
  [RichTextControl.COLOR]: 'Text color',
  [RichTextControl.BACKGROUND]: 'Highlight color',
  [RichTextControl.ALIGN]: 'Text alignment',
  [RichTextControl.DIRECTION]: 'Right-to-left text direction',
  [RichTextControl.LINK]: 'Link',
  [RichTextControl.IMAGE]: 'Image',
  [RichTextControl.VIDEO]: 'Video',
  [RichTextControl.FORMULA]: 'Formula',
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
 * Several controls share a class and differ only by value — the list variants
 * are all `ql-list`, subscript/superscript are both `ql-script`, and indent and
 * outdent are both `ql-indent` — which is why the format is tracked separately
 * from the value.
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
  [RichTextControl.STRIKETHROUGH]: { buttonClass: 'ql-strike', value: null, format: 'strike' },
  [RichTextControl.INLINE_CODE]: { buttonClass: 'ql-code', value: null, format: 'code' },
  [RichTextControl.SUBSCRIPT]: { buttonClass: 'ql-script', value: 'sub', format: 'script' },
  [RichTextControl.SUPERSCRIPT]: { buttonClass: 'ql-script', value: 'super', format: 'script' },
  [RichTextControl.BULLET_LIST]: { buttonClass: 'ql-list', value: 'bullet', format: 'list' },
  [RichTextControl.ORDERED_LIST]: { buttonClass: 'ql-list', value: 'ordered', format: 'list' },
  [RichTextControl.CHECK_LIST]: { buttonClass: 'ql-list', value: 'check', format: 'list' },
  [RichTextControl.INDENT]: { buttonClass: 'ql-indent', value: '+1', format: 'indent' },
  [RichTextControl.OUTDENT]: { buttonClass: 'ql-indent', value: '-1', format: 'indent' },
  [RichTextControl.BLOCKQUOTE]: {
    buttonClass: 'ql-blockquote',
    value: null,
    format: 'blockquote',
  },
  [RichTextControl.CODE_BLOCK]: { buttonClass: 'ql-code-block', value: null, format: 'code-block' },
  [RichTextControl.HEADER]: { buttonClass: 'ql-header', value: null, format: 'header' },
  [RichTextControl.SIZE]: { buttonClass: 'ql-size', value: null, format: 'size' },
  [RichTextControl.FONT]: { buttonClass: 'ql-font', value: null, format: 'font' },
  [RichTextControl.COLOR]: { buttonClass: 'ql-color', value: null, format: 'color' },
  [RichTextControl.BACKGROUND]: { buttonClass: 'ql-background', value: null, format: 'background' },
  [RichTextControl.ALIGN]: { buttonClass: 'ql-align', value: null, format: 'align' },
  [RichTextControl.DIRECTION]: { buttonClass: 'ql-direction', value: 'rtl', format: 'direction' },
  [RichTextControl.LINK]: { buttonClass: 'ql-link', value: null, format: 'link' },
  [RichTextControl.IMAGE]: { buttonClass: 'ql-image', value: null, format: 'image' },
  [RichTextControl.VIDEO]: { buttonClass: 'ql-video', value: null, format: 'video' },
  [RichTextControl.FORMULA]: { buttonClass: 'ql-formula', value: null, format: 'formula' },
  [RichTextControl.CLEAN]: { buttonClass: 'ql-clean', value: null, format: null },
};
