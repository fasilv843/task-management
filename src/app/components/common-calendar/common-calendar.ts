import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, EventInput, EventMountArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';

import { parseDateOnly } from '../../utils/date.utils';
import {
  CALENDAR_VIEW_LABELS,
  CalendarEvent,
  CalendarView,
  DEFAULT_CALENDAR_VIEWS,
} from './common-calendar.types';

/**
 * Module-level so the array keeps one identity for the life of the app. The
 * FullCalendar wrapper compares options by identity, and a fresh plugin array
 * invalidates its memoised plugin hooks, which rebuilds every view definition
 * and re-parses the toolbar — on every single events change.
 */
const CALENDAR_PLUGINS = [dayGridPlugin, listPlugin];

/**
 * CommonCalendar
 *
 * The only place in the app that knows FullCalendar exists — same boundary the
 * rich text editor draws around Quill. It takes dated events in and emits an id
 * out; it does not fetch, it does not navigate, and it knows nothing about what
 * the events stand for.
 *
 * Options are a computed signal, so a reloaded resource produces a new options
 * object, the OnPush view is dirtied by the signal read, and the FullCalendar
 * wrapper re-applies them on its next check. Nothing here needs NgZone, which
 * is what makes it safe under zoneless change detection.
 *
 * Usage:
 *   <app-common-calendar
 *     [events]="calendarEvents()"
 *     [views]="[CalendarView.MONTH, CalendarView.WEEK]"
 *     (eventSelect)="openEvent($event)"
 *   />
 */
@Component({
  selector: 'app-common-calendar',
  imports: [FullCalendarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './common-calendar.css',
  host: { class: 'block' },
  template: '<full-calendar [options]="calendarOptions()" />',
})
export class CommonCalendar {
  readonly events = input.required<readonly CalendarEvent[]>();

  /**
   * The views offered in the switcher, in the order they appear. The first one
   * is the view the calendar opens on; pass a single view to drop the switcher
   * altogether.
   *
   * There is deliberately no separate `initialView` input: the calendar reads
   * its opening view once, when it is constructed, so such an input would work
   * on first render and then silently do nothing. Deriving it from the first
   * entry also makes an opening view that has no switcher button — and so no
   * way back to it — impossible to express.
   */
  readonly views = input<readonly CalendarView[]>(DEFAULT_CALENDAR_VIEWS);

  /** Emits the id of the event that was activated. */
  readonly eventSelect = output<string>();

  private readonly dateLabelFormat = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  /**
   * Its own computed so its identity survives an events change — see the note
   * on CALENDAR_PLUGINS. A lone view needs no switcher, and an empty section
   * renders no buttons.
   */
  private readonly headerToolbar = computed(() => {
    const views = this.views();

    return {
      left: 'prev,next today',
      center: 'title',
      right: views.length > 1 ? views.join(',') : '',
    };
  });

  protected readonly calendarOptions = computed<CalendarOptions>(() => ({
    plugins: CALENDAR_PLUGINS,
    initialView: this.views()[0] ?? CalendarView.MONTH,
    headerToolbar: this.headerToolbar(),
    buttonText: CALENDAR_VIEW_LABELS,
    height: 'auto',
    fixedWeekCount: false,
    // A whole-day event and an expanded cell beat a "+2 more" popover we would
    // then have to make keyboard-dismissible.
    dayMaxEvents: false,
    // Every event here is all-day, so the agenda's time column would say
    // "all-day" on every single row and carry nothing.
    displayEventTime: false,
    events: this.events().map((event) => this.toEventInput(event)),
    eventClick: this.handleEventClick,
    eventDidMount: this.describeEvent,
  }));

  private toEventInput(event: CalendarEvent): EventInput {
    return {
      id: event.id,
      title: event.title,
      // Already 'YYYY-MM-DD'; allDay keeps FullCalendar from shifting it across
      // a timezone boundary.
      start: event.date,
      allDay: true,
      url: event.url,
      backgroundColor: event.colors?.background,
      borderColor: event.colors?.border,
      textColor: event.colors?.text,
      extendedProps: { ariaLabel: event.ariaLabel },
    };
  }

  /**
   * Bound once as a field so its identity survives an events change.
   *
   * The click is always prevented, including the modified ones. In the agenda
   * an event that carries a url is treated as a forced link, and the calendar
   * sends the current tab to it by hand unless the click was prevented — so
   * leaving a ctrl-click to the browser would open the new tab *and* navigate
   * the app out from under it. Opening the tab ourselves is the price of that.
   */
  private readonly handleEventClick = (arg: EventClickArg): void => {
    arg.jsEvent.preventDefault();

    const { ctrlKey, metaKey, shiftKey } = arg.jsEvent;

    if (ctrlKey || metaKey || shiftKey) {
      if (arg.event.url) {
        window.open(arg.event.url, '_blank', 'noopener');
      }

      return;
    }

    this.eventSelect.emit(arg.event.id);
  };

  /**
   * FullCalendar labels an event with its title alone, which out of context
   * says nothing about when it falls. The date reaches the label here, and a
   * caller that has more to say — a status, an owner — supplies the whole
   * label itself.
   *
   * The label has to land on whatever the user actually focuses. In the grid
   * views that is `arg.el` itself; in the agenda `arg.el` is the table row and
   * the focusable link sits inside it, so the row would carry a label nobody
   * ever reaches. Matching a bare anchor rather than `a[href]` is deliberate:
   * an event with no url still renders one, with keyboard attributes and no
   * href.
   */
  private readonly describeEvent = (arg: EventMountArg): void => {
    const { ariaLabel } = arg.event.extendedProps as Pick<CalendarEvent, 'ariaLabel'>;
    const dateLabel = this.dateLabelFormat.format(parseDateOnly(arg.event.startStr));
    const target = arg.el.querySelector('a') ?? arg.el;

    target.setAttribute('aria-label', ariaLabel ?? `${arg.event.title}, ${dateLabel}`);
  };
}
