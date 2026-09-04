import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: 'tasks', pathMatch: 'full', redirectTo: 'tasks/list' },
    // 'list', 'calendar', 'create' and 'update' must all stay above 'tasks/:id',
    // otherwise they match the details route.
    {
        path: 'tasks/list',
        loadComponent: () => import('./pages/tasks/tasks').then((m) => m.Tasks),
    },
    {
        // Lazy on purpose: FullCalendar is heavy and belongs in this route's own chunk.
        path: 'tasks/calendar',
        loadComponent: () =>
            import('./pages/tasks-calendar/tasks-calendar').then((m) => m.TasksCalendar),
    },
    {
        path: 'tasks/create',
        loadComponent: () => import('./pages/task-form/task-form').then((m) => m.TaskForm),
    },
    {
        path: 'tasks/update/:id',
        loadComponent: () => import('./pages/task-form/task-form').then((m) => m.TaskForm),
    },
    {
        path: 'tasks/:id',
        loadComponent: () => import('./pages/task-details/task-details').then((m) => m.TaskDetails),
    },
    { path: '', pathMatch: 'full', redirectTo: 'tasks' }
];
