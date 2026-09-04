import { TaskStatus } from '../../services/task.types';

// TODO - create and update does not need to an enum, use strings
/** Which of the two routes (`tasks/create` or `tasks/update/:id`) rendered the form. */
export enum TaskFormMode {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
}

/** A single status choice rendered in the status `<select>`. */
export interface TaskStatusOption {
  value: TaskStatus;
  label: string;
}
