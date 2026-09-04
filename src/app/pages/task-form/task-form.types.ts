import { TaskStatus } from '../../services/task.types';

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
