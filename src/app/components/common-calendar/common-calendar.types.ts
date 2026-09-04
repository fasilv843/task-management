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
