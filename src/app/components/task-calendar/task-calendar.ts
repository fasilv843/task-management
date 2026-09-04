import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, EventInput, EventMountArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';

import { parseDateOnly } from '../../utils/date.utils';
import { TASK_STATUS_LABELS, Task } from '../../services/task.types';
import { TASK_STATUS_EVENT_COLORS, TaskEventProps } from './task-calendar.types';

// TODO - update the name TaskCalendar to Calendar 
// TODO - remove task logic, make sure this will be reusable for all kind of calendar usage

/**
 * TaskCalendar
 *
 * The only place in the app that knows FullCalendar exists — same boundary the
 * rich text editor draws around Quill. It takes tasks in and emits an id out;
 * it does not fetch, and it does not navigate.
 *
 * Options are a computed signal, so a reloaded resource produces a new options
 * object, the OnPush view is dirtied by the signal read, and the FullCalendar
 * wrapper re-applies them on its next check. Nothing here needs NgZone, which
 * is what makes it safe under zoneless change detection.
 */
@Component({
  selector: 'app-task-calendar',
  imports: [FullCalendarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './task-calendar.css',
  host: { class: 'block' },
  template: '<full-calendar [options]="calendarOptions()" />',
})
export class TaskCalendar {
  readonly tasks = input.required<readonly Task[]>();

  /** Emits the id of the task whose event was activated. */
  readonly taskSelect = output<string>();

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
    // A deadline is a whole day, and an expanded cell beats a "+2 more" popover
    // we would then have to make keyboard-dismissible.
    dayMaxEvents: false,
    events: this.tasks().map((task) => this.toEvent(task)),
    eventClick: (arg: EventClickArg) => this.onEventClick(arg),
    eventDidMount: (arg: EventMountArg) => this.describeEvent(arg),
  }));

  private toEvent(task: Task): EventInput {
    const colors = TASK_STATUS_EVENT_COLORS[task.status];

    return {
      id: task.id,
      title: task.title,
      // Already 'YYYY-MM-DD'; allDay keeps FullCalendar from shifting it across
      // a timezone boundary.
      start: task.deadline,
      allDay: true,
      // Makes FullCalendar render a real <a href>, so events are focusable,
      // Enter-activatable and openable in a new tab. Without it they are inert
      // <a> elements and the calendar is unreachable by keyboard.
      url: `/tasks/${task.id}`,
      backgroundColor: colors.background,
      borderColor: colors.border,
      textColor: colors.text,
      extendedProps: { status: task.status } satisfies TaskEventProps,
    };
  }

  private onEventClick(arg: EventClickArg): void {
    // Leave modified clicks to the browser so "open in new tab" still works.
    if (arg.jsEvent.ctrlKey || arg.jsEvent.metaKey || arg.jsEvent.shiftKey) {
      return;
    }

    arg.jsEvent.preventDefault();
    this.taskSelect.emit(arg.event.id);
  }

  /**
   * FullCalendar labels an event with its title alone, which out of context
   * says nothing about when it is due or where it stands. Status also reaches
   * the label here so colour is never the only carrier of it.
   */
  private describeEvent(arg: EventMountArg): void {
    const { status } = arg.event.extendedProps as TaskEventProps;
    const deadline = arg.event.startStr;
    const dueLabel = this.dateLabelFormat.format(parseDateOnly(deadline));

    arg.el.setAttribute(
      'aria-label',
      `${arg.event.title}, ${TASK_STATUS_LABELS[status]}, due ${dueLabel}`,
    );
  }
}
