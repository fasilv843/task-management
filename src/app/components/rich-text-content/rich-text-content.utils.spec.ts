import { normalizeRichTextHtml } from './rich-text-content.utils';

describe('normalizeRichTextHtml', () => {
  it('turns an editor bullet list into a real unordered list', () => {
    const result = normalizeRichTextHtml(
      '<ol><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span>First</li>' +
        '<li data-list="bullet"><span class="ql-ui" contenteditable="false"></span>Second</li></ol>',
    );

    expect(result).toBe('<ul><li>First</li><li>Second</li></ul>');
  });

  it('turns an editor numbered list into a real ordered list', () => {
    const result = normalizeRichTextHtml(
      '<ol><li data-list="ordered"><span class="ql-ui"></span>First</li></ol>',
    );

    expect(result).toBe('<ol><li>First</li></ol>');
  });

  it('splits a mixed list into one list per run, in source order', () => {
    const result = normalizeRichTextHtml(
      '<ol><li data-list="bullet">A</li><li data-list="ordered">B</li>' +
        '<li data-list="ordered">C</li><li data-list="bullet">D</li></ol>',
    );

    expect(result).toBe('<ul><li>A</li></ul><ol><li>B</li><li>C</li></ol><ul><li>D</li></ul>');
  });

  it('leaves already-semantic markup untouched', () => {
    const semantic = '<p>Design the login flow.</p><ul><li>Define user flow</li></ul>';

    expect(normalizeRichTextHtml(semantic)).toBe(semantic);
  });

  it('is idempotent', () => {
    const source = '<ol><li data-list="bullet"><span class="ql-ui"></span>First</li></ol>';
    const once = normalizeRichTextHtml(source);

    expect(normalizeRichTextHtml(once)).toBe(once);
  });

  it('preserves inline formatting', () => {
    const formatted = '<p><strong>Bold</strong> <em>italic</em> <u>underlined</u></p>';

    expect(normalizeRichTextHtml(formatted)).toBe(formatted);
  });

  it.each(['', '   ', '<p><br></p>', '<p></p>'])('reports %p as no content', (empty) => {
    expect(normalizeRichTextHtml(empty)).toBe('');
  });
});
