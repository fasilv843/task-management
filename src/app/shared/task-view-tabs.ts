import { TabOption } from '../components/common-tab/common-tab.types';

/**
 * The two ways of browsing tasks. `id` is the route segment under `/tasks`,
 * so a page can navigate straight to `['/tasks', id]` on `tabSelect`.
 */
export const TASK_VIEW_TABS: readonly TabOption[] = [
  { id: 'list', label: 'List' },
  { id: 'calendar', label: 'Calendar' },
];
