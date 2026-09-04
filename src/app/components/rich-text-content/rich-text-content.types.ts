/**
 * Values the editor writes into `data-list` on a list item. Quill 2 uses the
 * attribute — not the element type — to distinguish a bullet list from a
 * numbered one, so both arrive as `<ol>`.
 */
export enum QuillListType {
  BULLET = 'bullet',
  ORDERED = 'ordered',
}
