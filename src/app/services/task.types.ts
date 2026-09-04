import { StatusTone } from '../components/common-status/common-status.types';
import { TaskComment } from './comment.types';

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

/**
 * Options for the task reads, standing in for a query string: asking for
 * `{ comments: true }` is the `?comments=true` of this fake API, and returns the
 * task with its thread already attached rather than requiring a second call.
 */
export interface TaskQueryOptions {
  comments?: boolean;
}

/** What a task read returns when comments were requested. */
export interface TaskWithComments extends Task {
  comments: TaskComment[];
}
