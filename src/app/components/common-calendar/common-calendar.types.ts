/**
 * The ranges the calendar can be shown in. The values double as the underlying
 * calendar's registered view names, the same way `RichTextControl`'s values
 * double as the editor's format names.
 */
export enum CalendarView {
  MONTH = 'dayGridMonth',
  WEEK = 'dayGridWeek',
  AGENDA = 'listWeek',
}

/**
 * Names for the view switcher buttons, lowercase to match the voice of the
 * `prev`/`next`/`today` buttons beside them.
 *
 * Keyed by the enum on purpose. The agenda view inherits a `list` button-text
 * key from the view it is built on, and that key is consulted *before* the view
 * name — so a stray `list` entry here would silently outrank `listWeek` and
 * rename the button. A `Record` over the enum makes that key unrepresentable.
 */
export const CALENDAR_VIEW_LABELS: Record<CalendarView, string> = {
  [CalendarView.MONTH]: 'month',
  [CalendarView.WEEK]: 'week',
  [CalendarView.AGENDA]: 'agenda',
};

/** The first entry is also the view the calendar opens on. */
export const DEFAULT_CALENDAR_VIEWS: readonly CalendarView[] = [
  CalendarView.MONTH,
  CalendarView.WEEK,
  CalendarView.AGENDA,
];

export interface CalendarEventColors {
  /** Event fill. */
  background: string;
  /** Event border, the darker sibling of the fill. */
  border: string;
  /** Event text, chosen to clear WCAG AA against `background`. */
  text: string;
}

/**
 * One entry on the calendar.
 *
 * Deliberately free of any domain vocabulary: a caller maps whatever it holds
 * — deadlines, appointments, releases — onto this shape and keeps the meaning
 * (colour scheme, link target, wording of the label) on its own side.
 */
export interface CalendarEvent {
  id: string;
  /** Local calendar date, 'YYYY-MM-DD'. Rendered all day. */
  date: string;
  title: string;
  /**
   * Rendered as a real `<a href>` when set, which is what makes an event
   * focusable, Enter-activatable and openable in a new tab. Without it the
   * calendar is unreachable by keyboard, so pass one wherever an event has a
   * destination.
   */
  url?: string;
  /**
   * Literal colours rather than classes: FullCalendar renders its own DOM,
   * outside Angular's style encapsulation, so the colours have to travel with
   * the event data. Omit to keep FullCalendar's defaults.
   */
  colors?: CalendarEventColors;
  /** Overrides the default `"<title>, <date>"` accessible label. */
  ariaLabel?: string;
}
