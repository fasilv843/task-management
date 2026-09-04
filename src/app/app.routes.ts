import { Routes } from '@angular/router';
import { Tasks } from './pages/tasks/tasks';
import { TaskDetails } from './pages/task-details/task-details';
import { TaskForm } from './pages/task-form/task-form';

export const routes: Routes = [
    {
        path: 'tasks',
        component: Tasks,
    },
    {
        path: 'tasks/create',
        component: TaskForm,
    },
    {
        path: 'tasks/update/:id',
        component: TaskForm,
    },
    {
        path: 'tasks/:id',
        component: TaskDetails,
    },
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'tasks'
    }
];
