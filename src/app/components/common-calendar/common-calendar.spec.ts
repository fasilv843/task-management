import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { CommonCalendar } from './common-calendar';
import { CalendarEvent } from './common-calendar.types';

/**
 * The calendar opens on the current month, so the fixtures have to fall inside
 * it — days 12 and 20 exist in every month.
 */
function dayOfThisMonth(day: number): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  return `${now.getFullYear()}-${month}-${String(day).padStart(2, '0')}`;
}

const LOGIN_DATE = dayOfThisMonth(12);
const RELEASE_DATE = dayOfThisMonth(20);

const LOGIN_COLORS = { background: '#dfe6ec', border: '#28425a', text: '#1d3348' };

const EVENTS: CalendarEvent[] = [
  {
    id: '1',
    title: 'Design the login flow',
    date: LOGIN_DATE,
    url: '/tasks/1',
    colors: LOGIN_COLORS,
    ariaLabel: 'Design the login flow, In progress, due later this month',
  },
  {
    id: '2',
    title: 'Write release notes',
    date: RELEASE_DATE,
    url: '/tasks/2',
    colors: { background: '#dcece3', border: '#3c7a5c', text: '#2f6b4c' },
  },
];

/**
 * FullCalendar builds its own DOM, so these specs assert against what it
 * actually rendered rather than against the options object — that is the only
 * way to catch the two things that would silently break the feature: events
 * losing their href (which makes the calendar keyboard-unreachable) and a date
 * landing on the wrong day.
 */
describe('CommonCalendar', () => {
  let fixture: ComponentFixture<CommonCalendar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonCalendar],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(CommonCalendar);
    fixture.componentRef.setInput('events', EVENTS);
    await fixture.whenStable();
  });

  function events(): HTMLAnchorElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('a.fc-event'));
  }

  function eventFor(title: string): HTMLAnchorElement {
    const match = events().find((event) => event.textContent?.includes(title));
    expect(match).toBeTruthy();

    return match as HTMLAnchorElement;
  }

  it('renders a month grid', () => {
    expect(fixture.nativeElement.querySelector('.fc-dayGridMonth-view')).toBeTruthy();
  });

  it('places each event on its date', () => {
    const day = eventFor('Design the login flow').closest('.fc-daygrid-day');

    expect(day?.getAttribute('data-date')).toBe(LOGIN_DATE);
  });

  it('links each event to the url it was given', () => {
    expect(eventFor('Write release notes').getAttribute('href')).toBe('/tasks/2');
  });

  it('applies the colours it was given', () => {
    // The DOM reports the colour back as rgb().
    expect(eventFor('Design the login flow').style.backgroundColor).toBe(
      toRgb(LOGIN_COLORS.background),
    );
  });

  it('names an event with the label it was given', () => {
    expect(eventFor('Design the login flow').getAttribute('aria-label')).toBe(EVENTS[0].ariaLabel);
  });

  it('falls back to the title and date when no label is given', () => {
    const label = eventFor('Write release notes').getAttribute('aria-label');

    expect(label).toContain('Write release notes');
    expect(label).toContain('20');
  });

  it('renders an event that carries nothing but a title and a date', async () => {
    fixture.componentRef.setInput('events', [
      { id: '3', title: 'Bare event', date: LOGIN_DATE } satisfies CalendarEvent,
    ]);
    await fixture.whenStable();

    const bare = fixture.nativeElement.querySelector('.fc-event') as HTMLElement;

    expect(bare.getAttribute('aria-label')).toContain('Bare event');
  });

  it('emits the event id instead of following the link', async () => {
    const selected: string[] = [];
    fixture.componentInstance.eventSelect.subscribe((id) => selected.push(id));

    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    eventFor('Write release notes').dispatchEvent(click);
    await fixture.whenStable();

    expect(selected).toEqual(['2']);
    expect(click.defaultPrevented).toBe(true);
  });

  it('re-renders when the events change', async () => {
    fixture.componentRef.setInput('events', [EVENTS[0]]);
    await fixture.whenStable();

    expect(events()).toHaveLength(1);
  });
});

function toRgb(hex: string): string {
  const [red, green, blue] = [1, 3, 5].map((start) =>
    Number.parseInt(hex.slice(start, start + 2), 16),
  );

  return `rgb(${red}, ${green}, ${blue})`;
}
