import { CalendarEventColors } from '../../../components/common-calendar/common-calendar.types';
import { TaskStatus } from '../../../services/task.types';

/**
 * The same warning / info / success families the list page paints a status in
 * (see TASK_STATUS_TONES and common-status.css), so a task reads identically in
 * either view.
 *
 * These are `var()` references rather than Tailwind classes because FullCalendar
 * renders its own DOM, outside Angular's style encapsulation — the colours have
 * to travel with the event data as inline styles. Custom properties still
 * inherit into that DOM from `:root`, so the tokens resolve there and the two
 * views cannot drift apart. The `-bg` fill with an `-ink` label is the pairing
 * whose contrast is already known to clear AA (the solid base colour is the
 * dot/border only).
 *
 * It lives beside the page rather than beside the calendar because what a
 * status looks like is task knowledge; the calendar only knows it was handed
 * three colours.
 */
export const TASK_STATUS_EVENT_COLORS: Record<TaskStatus, CalendarEventColors> = {
  [TaskStatus.PENDING]: {
    background: 'var(--color-warning-bg)',
    border: 'var(--color-warning)',
    text: 'var(--color-warning-ink)',
  },
  [TaskStatus.IN_PROGRESS]: {
    background: 'var(--color-info-bg)',
    border: 'var(--color-info)',
    text: 'var(--color-info-ink)',
  },
  [TaskStatus.COMPLETED]: {
    background: 'var(--color-success-bg)',
    border: 'var(--color-success)',
    text: 'var(--color-success-ink)',
  },
};
