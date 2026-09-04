import { TaskStatus } from '../../services/task.types';

/** A single status choice rendered in the status `<select>`. */
export interface TaskStatusOption {
  value: TaskStatus;
  label: string;
}
