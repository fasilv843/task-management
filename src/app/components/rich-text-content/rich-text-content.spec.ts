import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';

import { RichTextContent } from './rich-text-content';

/**
 * jsdom performs no layout, so `scrollHeight` and `clientHeight` are always 0
 * and overflow can never occur on its own. These specs stub the two sizes on
 * the clamped element and drive the component's `ResizeObserver` by hand, which
 * is the same path a real reflow takes.
 */
class CapturingResizeObserver implements ResizeObserver {
  static readonly callbacks: ResizeObserverCallback[] = [];

  constructor(callback: ResizeObserverCallback) {
    CapturingResizeObserver.callbacks.push(callback);
  }

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

describe('RichTextContent', () => {
  let fixture: ComponentFixture<RichTextContent>;
  let originalResizeObserver: typeof ResizeObserver;

  beforeEach(async () => {
    originalResizeObserver = globalThis.ResizeObserver;
    CapturingResizeObserver.callbacks.length = 0;
    globalThis.ResizeObserver = CapturingResizeObserver;

    await TestBed.configureTestingModule({
      imports: [RichTextContent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(RichTextContent);
    fixture.componentRef.setInput('html', '<p>Design the login flow.</p>');
    fixture.componentRef.setInput('contentLabel', 'Design authentication flow');
    await fixture.whenStable();
  });

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver;
  });

  function clipElement(): HTMLElement {
    return fixture.nativeElement.querySelector('.rich-text-content');
  }

  function toggleButton(): HTMLButtonElement | null {
    return fixture.debugElement.query(By.css('button'))?.nativeElement ?? null;
  }

  /** Pretends the content is `contentHeight` tall inside a `visibleHeight` clip. */
  async function reportSize(contentHeight: number, visibleHeight: number): Promise<void> {
    const clip = clipElement();

    Object.defineProperty(clip, 'scrollHeight', { value: contentHeight, configurable: true });
    Object.defineProperty(clip, 'clientHeight', { value: visibleHeight, configurable: true });

    CapturingResizeObserver.callbacks.forEach((callback) =>
      callback([], {} as unknown as ResizeObserver),
    );

    await fixture.whenStable();
  }

  it('renders the description', () => {
    expect(clipElement().textContent).toContain('Design the login flow.');
  });

  it('rewrites editor list markup into a real list', async () => {
    fixture.componentRef.setInput(
      'html',
      '<ol><li data-list="bullet"><span class="ql-ui"></span>Define user flow</li></ol>',
    );
    await fixture.whenStable();

    const list = fixture.nativeElement.querySelector('ul');

    expect(list).not.toBeNull();
    expect(list.textContent).toContain('Define user flow');
  });

  it('renders nothing when the description is empty', async () => {
    fixture.componentRef.setInput('html', '<p><br></p>');
    await fixture.whenStable();

    expect(clipElement()).toBeNull();
  });

  it('offers no toggle while the content fits', async () => {
    await reportSize(80, 96);

    expect(toggleButton()).toBeNull();
  });

  it('expands and collapses once the content overflows', async () => {
    await reportSize(240, 96);

    const button = toggleButton();

    expect(button).not.toBeNull();
    expect(button!.textContent?.trim()).toBe('Show more');
    expect(button!.getAttribute('aria-expanded')).toBe('false');
    expect(button!.getAttribute('aria-controls')).toBe(clipElement().id);
    expect(button!.getAttribute('aria-label')).toBe('Show more of Design authentication flow');
    expect(clipElement().classList).toContain('rich-text-content--clipped');

    button!.click();
    await fixture.whenStable();

    expect(toggleButton()!.textContent?.trim()).toBe('Show less');
    expect(toggleButton()!.getAttribute('aria-expanded')).toBe('true');
    expect(clipElement().classList).not.toContain('rich-text-content--clipped');

    toggleButton()!.click();
    await fixture.whenStable();

    expect(toggleButton()!.textContent?.trim()).toBe('Show more');
    expect(clipElement().classList).toContain('rich-text-content--clipped');
  });

  it('hides the toggle again when the content no longer overflows', async () => {
    await reportSize(240, 96);
    expect(toggleButton()).not.toBeNull();

    await reportSize(80, 96);

    expect(toggleButton()).toBeNull();
  });
});
