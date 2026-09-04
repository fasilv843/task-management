import { CalendarEventColors } from '../../../components/common-calendar/common-calendar.types';
import { TaskStatus } from '../../../services/task.types';

/**
 * Mirrors the --color-status-* tokens in src/styles.css.
 *
 * These are literal values rather than Tailwind classes because FullCalendar
 * renders its own DOM, outside Angular's style encapsulation — the colours have
 * to travel with the event data. The `-bg` / `-ink` pairing is the same one the
 * list page uses for status text, so the two views read alike and the contrast
 * ratio is already known to pass AA (the solid base colour with white text does
 * not).
 *
 * It lives beside the page rather than beside the calendar because what a
 * status looks like is task knowledge; the calendar only knows it was handed
 * three colours.
 */
export const TASK_STATUS_EVENT_COLORS: Record<TaskStatus, CalendarEventColors> = {
  [TaskStatus.PENDING]: { background: '#f3e6d2', border: '#a8752a', text: '#8a5a1e' },
  [TaskStatus.IN_PROGRESS]: { background: '#dfe6ec', border: '#28425a', text: '#1d3348' },
  [TaskStatus.COMPLETED]: { background: '#dcece3', border: '#3c7a5c', text: '#2f6b4c' },
};
