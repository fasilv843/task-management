import { QuillListType } from './rich-text-content.types';

/**
 * Quill 2 marks list items with a `data-list` attribute rather than the element
 * type: a bullet list and a numbered list are both `<ol>`, and the markers come
 * entirely from `.ql-editor li[data-list] > .ql-ui::before` in the editor's own
 * stylesheet. Outside the editor that selector never matches, and Angular's
 * sanitizer drops `data-*` before CSS could match on it anyway — so the markup
 * is rewritten into plain semantic HTML instead.
 */

/**
 * Rewrites editor HTML into semantic HTML that renders correctly on its own.
 *
 * Bullet runs become `<ul>` and numbered runs `<ol>`, so assistive tech
 * announces a real list. Markup that is already semantic — such as the seeded
 * task data — passes through unchanged, which also makes this idempotent.
 */
export function normalizeRichTextHtml(html: string): string {
  if (!html.trim()) {
    return '';
  }

  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const body = parsed.body;

  // The editor's marker holders carry no content of their own.
  body.querySelectorAll('span.ql-ui').forEach((element) => element.remove());

  body.querySelectorAll('ol, ul').forEach((list) => rewriteList(parsed, list));

  // An "empty" document still arrives as `<p><br></p>`; report it as no content
  // so callers can skip rendering entirely.
  return body.textContent?.trim() ? body.innerHTML : '';
}

/**
 * Splits one list into consecutive runs of the same `data-list` value and
 * replaces it with a correctly typed list per run, preserving order. A list
 * whose items carry no `data-list` is already semantic and is left alone.
 */
function rewriteList(document: Document, list: Element): void {
  const items = Array.from(list.children);

  if (!items.some((item) => item.hasAttribute('data-list'))) {
    return;
  }

  const sourceTagName = list.tagName.toLowerCase();
  const replacements: Element[] = [];
  let currentType: string | null = null;
  let currentList: Element | null = null;

  for (const item of items) {
    // An item without the attribute keeps whatever the source list already was.
    const type = item.getAttribute('data-list') ?? sourceTagName;
    item.removeAttribute('data-list');

    if (!currentList || type !== currentType) {
      currentType = type;
      currentList = document.createElement(isOrdered(type) ? 'ol' : 'ul');
      replacements.push(currentList);
    }

    currentList.append(item);
  }

  list.replaceWith(...replacements);
}

function isOrdered(type: string): boolean {
  return type === QuillListType.ORDERED || type === 'ol';
}
