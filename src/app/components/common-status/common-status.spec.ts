import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { CommonStatus } from './common-status';
import { StatusTone } from './common-status.types';

describe('CommonStatus', () => {
  let fixture: ComponentFixture<CommonStatus>;
  let component: CommonStatus;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonStatus],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(CommonStatus);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('tone', StatusTone.Warning);
    fixture.componentRef.setInput('label', 'Pending');
    await fixture.whenStable();
  });

  function chip(): HTMLSpanElement {
    return fixture.nativeElement.querySelector('span') as HTMLSpanElement;
  }

  async function setInputs(inputs: Record<string, unknown>): Promise<void> {
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    await fixture.whenStable();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the label', () => {
    expect(chip().textContent?.trim()).toBe('Pending');
  });

  it('applies the tone class', () => {
    expect(chip().className.split(' ')).toEqual(['status', 'status--warning']);
  });

  it('switches tone classes when the tone input changes', async () => {
    await setInputs({ tone: StatusTone.Success, label: 'Completed' });

    expect(chip().className.split(' ')).toEqual(['status', 'status--success']);
    expect(chip().textContent?.trim()).toBe('Completed');
  });

  it('hides the dot from assistive tech, leaving the label as the carrier of meaning', () => {
    const dot = chip().querySelector('.status__dot');

    expect(dot?.getAttribute('aria-hidden')).toBe('true');
  });
});
