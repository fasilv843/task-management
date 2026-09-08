import { TaskStatus } from '../../services/task.types';

/** A single status choice rendered in the status `<select>`. */
export interface TaskStatusOption {
  value: TaskStatus;
  label: string;
}

/**
 * Which job the form is doing. `tasks/create` has no `:id`; `tasks/update/:id`
 * does — that route difference is the whole mode switch.
 */
export enum TaskFormMode {
  CREATE,
  UPDATE,
}
