import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { todayDateOnly } from '../../utils/date.utils';
import { CommonCalendar } from './common-calendar';
import { CalendarEvent, CalendarView } from './common-calendar.types';

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
/** The week views show the current week, which only today is guaranteed to be in. */
const STANDUP_DATE = todayDateOnly();

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
  {
    id: '3',
    title: 'Run the standup',
    date: STANDUP_DATE,
    url: '/tasks/3',
    ariaLabel: 'Run the standup, Pending, due today',
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

  /**
   * The grid views make the event itself an anchor; the agenda wraps it in a
   * table row and puts the anchor inside. Both shapes have to be reachable
   * here, since the same assertions run against every view.
   */
  function events(): HTMLAnchorElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('a.fc-event, .fc-event a'));
  }

  function viewButton(view: CalendarView): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector(`.fc-${view}-button`);
  }

  async function switchTo(view: CalendarView): Promise<void> {
    viewButton(view)?.click();
    await fixture.whenStable();
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

  describe('view switcher', () => {
    it('offers a button for every view it was given', () => {
      expect(viewButton(CalendarView.MONTH)?.textContent).toBe('month');
      expect(viewButton(CalendarView.WEEK)?.textContent).toBe('week');
      expect(viewButton(CalendarView.AGENDA)?.textContent).toBe('agenda');
    });

    it('marks only the current view as pressed', async () => {
      expect(viewButton(CalendarView.MONTH)?.getAttribute('aria-pressed')).toBe('true');
      expect(viewButton(CalendarView.WEEK)?.getAttribute('aria-pressed')).toBe('false');

      await switchTo(CalendarView.WEEK);

      expect(viewButton(CalendarView.MONTH)?.getAttribute('aria-pressed')).toBe('false');
      expect(viewButton(CalendarView.WEEK)?.getAttribute('aria-pressed')).toBe('true');
    });

    it('renders no switcher when given a single view', async () => {
      fixture.componentRef.setInput('views', [CalendarView.MONTH]);
      await fixture.whenStable();

      expect(viewButton(CalendarView.WEEK)).toBeNull();
      expect(viewButton(CalendarView.MONTH)).toBeNull();
    });

    it('opens on the first view it was given', async () => {
      const single = TestBed.createComponent(CommonCalendar);
      single.componentRef.setInput('events', EVENTS);
      single.componentRef.setInput('views', [CalendarView.WEEK, CalendarView.MONTH]);
      await single.whenStable();

      expect(single.nativeElement.querySelector('.fc-dayGridWeek-view')).toBeTruthy();
    });

    it('switches to the week grid', async () => {
      await switchTo(CalendarView.WEEK);

      expect(fixture.nativeElement.querySelector('.fc-dayGridWeek-view')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.fc-dayGridMonth-view')).toBeNull();
      expect(eventFor('Run the standup')).toBeTruthy();
    });

    it('switches to the agenda', async () => {
      await switchTo(CalendarView.AGENDA);

      expect(fixture.nativeElement.querySelector('.fc-listWeek-view')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('tr.fc-list-event')).toBeTruthy();
    });

    /**
     * The selected view and the current date live in the calendar's own state,
     * not in the options object we rebuild on every events change. That is the
     * assumption the whole design rests on, so it is pinned here — a break
     * would otherwise show up as the calendar quietly snapping back to the
     * current month whenever the resource reloads.
     */
    it('keeps the selected view when the events change', async () => {
      await switchTo(CalendarView.WEEK);

      fixture.componentRef.setInput('events', [EVENTS[0]]);
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('.fc-dayGridWeek-view')).toBeTruthy();
    });

    it('keeps the current date when the events change', async () => {
      const title = () => fixture.nativeElement.querySelector('.fc-toolbar-title')?.textContent;

      fixture.nativeElement.querySelector('.fc-next-button').click();
      await fixture.whenStable();
      const paged = title();

      fixture.componentRef.setInput('events', [EVENTS[0]]);
      await fixture.whenStable();

      expect(title()).toBe(paged);
    });
  });

  describe('agenda', () => {
    beforeEach(async () => {
      await switchTo(CalendarView.AGENDA);
    });

    it('names the link rather than the row it sits in', () => {
      const link = eventFor('Run the standup');

      expect(link.tagName).toBe('A');
      expect(link.getAttribute('aria-label')).toBe(EVENTS[2].ariaLabel);
      expect(link.closest('tr')?.getAttribute('aria-label')).toBeNull();
    });

    it('links each event to the url it was given', () => {
      expect(eventFor('Run the standup').getAttribute('href')).toBe('/tasks/3');
    });

    /**
     * defaultPrevented is the flag that stops FullCalendar sending the current
     * tab to the event's url by hand, so this guards the SPA staying alive.
     */
    it('emits the event id instead of navigating', async () => {
      const selected: string[] = [];
      fixture.componentInstance.eventSelect.subscribe((id) => selected.push(id));

      const click = new MouseEvent('click', { bubbles: true, cancelable: true });
      eventFor('Run the standup').dispatchEvent(click);
      await fixture.whenStable();

      expect(selected).toEqual(['3']);
      expect(click.defaultPrevented).toBe(true);
    });

    it('omits the time column, since every event is all day', () => {
      expect(fixture.nativeElement.querySelector('.fc-list-event-time')).toBeNull();
    });

    it('says so when nothing falls in the week', async () => {
      fixture.componentRef.setInput('events', []);
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('.fc-list-empty')).toBeTruthy();
    });
  });
});

function toRgb(hex: string): string {
  const [red, green, blue] = [1, 3, 5].map((start) =>
    Number.parseInt(hex.slice(start, start + 2), 16),
  );

  return `rgb(${red}, ${green}, ${blue})`;
}
