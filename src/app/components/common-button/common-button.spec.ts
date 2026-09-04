import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { CommonButton } from './common-button';

describe('CommonButton', () => {
  let fixture: ComponentFixture<CommonButton>;
  let component: CommonButton;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonButton],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(CommonButton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  function button(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  }

  /** Applies inputs and lets the OnPush view catch up. */
  async function setInputs(inputs: Record<string, unknown>): Promise<void> {
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    await fixture.whenStable();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('label and defaults', () => {
    it('renders the label and defaults to a non-submitting button', async () => {
      await setInputs({ label: 'New task' });

      expect(button().textContent?.trim()).toBe('New task');
      expect(button().type).toBe('button');
    });

    it('renders no label span when the label is empty', () => {
      expect(button().querySelector('span')).toBeNull();
    });

    it('honours an explicit type, so it can submit a form', async () => {
      await setInputs({ type: 'submit' });

      expect(button().type).toBe('submit');
    });
  });

  describe('classes', () => {
    it('defaults to a medium filled button', () => {
      expect(button().className.split(' ')).toEqual(['btn', 'btn--filled', 'btn--md']);
    });

    it('applies the variant, size, and tone', async () => {
      await setInputs({ variant: 'outline', size: 'sm', tone: 'danger' });

      expect(button().className.split(' ')).toEqual([
        'btn',
        'btn--outline',
        'btn--sm',
        'btn--danger',
      ]);
    });

    it('gives the link variant no size class, so it inherits the surrounding text size', async () => {
      await setInputs({ variant: 'link', size: 'sm' });

      expect(button().className.split(' ')).toEqual(['btn', 'btn--link']);
    });

    it('omits the tone class for the default tone', async () => {
      await setInputs({ variant: 'subtle' });

      expect(button().className).not.toContain('btn--default');
    });
  });

  describe('clicks', () => {
    it('emits buttonClick with the originating event', async () => {
      const clicks: MouseEvent[] = [];
      component.buttonClick.subscribe((event) => clicks.push(event));

      button().click();
      await fixture.whenStable();

      expect(clicks.length).toBe(1);
      expect(clicks[0].type).toBe('click');
    });

    // The native `disabled` attribute already blocks most clicks; this guard
    // covers the rest (e.g. a click dispatched at the element directly).
    it('does not emit while disabled', async () => {
      const clicks: MouseEvent[] = [];
      component.buttonClick.subscribe((event) => clicks.push(event));
      await setInputs({ disabled: true });

      button().dispatchEvent(new MouseEvent('click'));
      await fixture.whenStable();

      expect(button().disabled).toBe(true);
      expect(clicks.length).toBe(0);
    });
  });

  describe('accessibility', () => {
    it('leaves the aria attributes off entirely when no input is given', () => {
      expect(button().hasAttribute('aria-label')).toBe(false);
      expect(button().hasAttribute('aria-expanded')).toBe(false);
      expect(button().hasAttribute('aria-controls')).toBe(false);
    });

    it('reflects the aria inputs onto the button', async () => {
      await setInputs({
        ariaLabel: 'Delete Ship the thing',
        ariaExpanded: false,
        ariaControls: 'comment-body-1',
      });

      expect(button().getAttribute('aria-label')).toBe('Delete Ship the thing');
      expect(button().getAttribute('aria-expanded')).toBe('false');
      expect(button().getAttribute('aria-controls')).toBe('comment-body-1');
    });

    it('drops aria-label again when the name resolves to null', async () => {
      await setInputs({ ariaLabel: 'Reply to: hello' });
      await setInputs({ ariaLabel: null });

      expect(button().hasAttribute('aria-label')).toBe(false);
    });

    // Callers restoring focus after an inline form closes rely on this.
    it('focus() moves focus to the underlying button', () => {
      component.focus();

      expect(document.activeElement).toBe(button());
    });
  });
});
