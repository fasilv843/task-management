import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { Router, provideRouter } from '@angular/router';

import { CommonTab } from './common-tab';
import { TabOption } from './common-tab.types';

@Component({ template: '' })
class BlankView {}

const TABS: readonly TabOption[] = [
  { label: 'List', route: ['/tasks', 'list'] },
  { label: 'Calendar', route: ['/tasks', 'calendar'] },
];

describe('CommonTab', () => {
  let fixture: ComponentFixture<CommonTab>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonTab],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: 'tasks/list', component: BlankView },
          { path: 'tasks/calendar', component: BlankView },
        ]),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(CommonTab);
    fixture.componentRef.setInput('tabs', TABS);
    fixture.componentRef.setInput('ariaLabel', 'Task views');
    await fixture.whenStable();
  });

  function anchors(): HTMLAnchorElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('a'));
  }

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  // The point of the component: real links, so middle-click and "Open link in
  // new tab" work. A <button> would have no href at all.
  it('renders one anchor per tab, each with a resolved href', () => {
    expect(anchors().map((anchor) => anchor.textContent?.trim())).toEqual([
      'List',
      'Calendar',
    ]);
    expect(anchors().map((anchor) => anchor.getAttribute('href'))).toEqual([
      '/tasks/list',
      '/tasks/calendar',
    ]);
  });

  it('names the nav landmark with the ariaLabel input', () => {
    const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;

    expect(nav.getAttribute('aria-label')).toBe('Task views');
  });

  it('marks only the tab matching the current URL as active', async () => {
    await router.navigate(['/tasks', 'calendar']);
    await fixture.whenStable();

    const [list, calendar] = anchors();

    expect(calendar.classList).toContain('tab--active');
    expect(calendar.getAttribute('aria-current')).toBe('page');

    expect(list.classList).not.toContain('tab--active');
    expect(list.hasAttribute('aria-current')).toBe(false);
  });

  it('moves the active marker when the route changes', async () => {
    await router.navigate(['/tasks', 'calendar']);
    await fixture.whenStable();
    await router.navigate(['/tasks', 'list']);
    await fixture.whenStable();

    const [list, calendar] = anchors();

    expect(list.classList).toContain('tab--active');
    expect(calendar.classList).not.toContain('tab--active');
  });
});
