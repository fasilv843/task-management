import { Routes } from '@angular/router';
import { Tasks } from './pages/tasks/tasks';

export const routes: Routes = [
    {
        path: 'tasks',
        component: Tasks,
    },
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'tasks'
    }
];
