import { Routes } from '@angular/router';
import { TaskListMain } from './pages/task-list-main/task-list-main';

export const routes: Routes = [
  {
    path: 'tasks',
    component: TaskListMain,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'list',
      },
      {
        path: 'list',
        loadComponent: () =>
          import('./pages/task-list-main/tasks/tasks').then((m) => m.Tasks),
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./pages/task-list-main/tasks-calendar/tasks-calendar')
            .then((m) => m.TasksCalendar),
      },
    ],
  },

  {
    path: 'tasks/create',
    loadComponent: () =>
      import('./pages/task-form/task-form').then((m) => m.TaskForm),
  },
  {
    path: 'tasks/update/:id',
    loadComponent: () =>
      import('./pages/task-form/task-form').then((m) => m.TaskForm),
  },
  {
    path: 'tasks/:id',
    loadComponent: () =>
      import('./pages/task-details/task-details').then((m) => m.TaskDetails),
  },

  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'tasks',
  },
];