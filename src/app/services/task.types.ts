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

export interface Task {
  id: number;
  title: string;
  description: string;
  deadline: string;
  status: TaskStatus;
}

export interface TaskListItem extends Task {
  isOverdue: boolean;
}
