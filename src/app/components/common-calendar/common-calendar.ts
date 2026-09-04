import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, EventInput, EventMountArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';

import { parseDateOnly } from '../../utils/date.utils';
import { CalendarEvent } from './common-calendar.types';

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

  /** Emits the id of the event that was activated. */
  readonly eventSelect = output<string>();

  private readonly dateLabelFormat = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  protected readonly calendarOptions = computed<CalendarOptions>(() => ({
    plugins: [dayGridPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
    height: 'auto',
    fixedWeekCount: false,
    // A whole-day event and an expanded cell beat a "+2 more" popover we would
    // then have to make keyboard-dismissible.
    dayMaxEvents: false,
    events: this.events().map((event) => this.toEventInput(event)),
    eventClick: (arg: EventClickArg) => this.onEventClick(arg),
    eventDidMount: (arg: EventMountArg) => this.describeEvent(arg),
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

  private onEventClick(arg: EventClickArg): void {
    // Leave modified clicks to the browser so "open in new tab" still works.
    if (arg.jsEvent.ctrlKey || arg.jsEvent.metaKey || arg.jsEvent.shiftKey) {
      return;
    }

    arg.jsEvent.preventDefault();
    this.eventSelect.emit(arg.event.id);
  }

  /**
   * FullCalendar labels an event with its title alone, which out of context
   * says nothing about when it falls. The date reaches the label here, and a
   * caller that has more to say — a status, an owner — supplies the whole
   * label itself.
   */
  private describeEvent(arg: EventMountArg): void {
    const { ariaLabel } = arg.event.extendedProps as Pick<CalendarEvent, 'ariaLabel'>;
    const dateLabel = this.dateLabelFormat.format(parseDateOnly(arg.event.startStr));

    arg.el.setAttribute('aria-label', ariaLabel ?? `${arg.event.title}, ${dateLabel}`);
  }
}
