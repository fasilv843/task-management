import { CalendarEventColors } from '../components/common-calendar/common-calendar.types';
import { StatusTone } from '../components/common-status/common-status.types';

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: 'Pending',
  [TaskStatus.IN_PROGRESS]: 'In progress',
  [TaskStatus.COMPLETED]: 'Completed',
};

/** Which `app-common-status` tone renders each task status. */
export const TASK_STATUS_TONES: Record<TaskStatus, StatusTone> = {
  [TaskStatus.PENDING]: StatusTone.Warning,
  [TaskStatus.IN_PROGRESS]: StatusTone.Info,
  [TaskStatus.COMPLETED]: StatusTone.Success,
};

/**
 * The same warning / info / success families `TASK_STATUS_TONES` paints a
 * status in, expressed as literal colours for the calendar — so a task reads
 * identically in either view.
 *
 * Literal `var()` references rather than Tailwind classes because FullCalendar
 * renders its own DOM, outside Angular's style encapsulation: the colours have
 * to travel with the event data as inline styles. Custom properties still
 * inherit into that DOM from `:root`, so the tokens resolve there and the two
 * views cannot drift apart. The `-bg` fill with an `-ink` label is the pairing
 * whose contrast is already known to clear AA (the solid base colour is the
 * dot/border only).
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

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: TaskStatus;
}

/**
 * A raw task row exactly as it sits in `tasks.json`: a UUID primary key, the
 * same shape a real table would hand back. `TaskRepo` maps it to a `Task`
 * before anything else in the app sees it.
 */
export interface TaskRow {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: TaskStatus;
}

export interface TaskListItem extends Task {
  isOverdue: boolean;
}

/** Payload used to create or update a task. The id is assigned by the store. */
export type TaskDraft = Omit<Task, 'id'>;
