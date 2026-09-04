import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'tasks',
        loadComponent: () => import('./pages/tasks/tasks').then((m) => m.Tasks),
    },
    // Must stay above 'tasks/:id', otherwise 'create' matches the details route.
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
