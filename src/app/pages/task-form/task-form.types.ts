import { TaskStatus } from '../../services/task.types';

/** Which of the two routes (`tasks/create` or `tasks/update/:id`) rendered the form. */
export enum TaskFormMode {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
}

/** Raw value of the task form. Mirrors `TaskDraft`, with `deadline` as `YYYY-MM-DD`. */
export interface TaskFormValue {
  title: string;
  description: string;
  deadline: string;
  status: TaskStatus;
}

/** A single status choice rendered in the status `<select>`. */
export interface TaskStatusOption {
  value: TaskStatus;
  label: string;
}
