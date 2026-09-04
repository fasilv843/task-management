/** The two ways of browsing the same tasks — each one its own page. */
export enum TaskView {
  LIST = 'LIST',
  CALENDAR = 'CALENDAR',
}

export const TASK_VIEW_LABELS: Record<TaskView, string> = {
  [TaskView.LIST]: 'List',
  [TaskView.CALENDAR]: 'Calendar',
};

export const TASK_VIEW_ROUTES: Record<TaskView, string> = {
  [TaskView.LIST]: '/tasks/list',
  [TaskView.CALENDAR]: '/tasks/calendar',
};
