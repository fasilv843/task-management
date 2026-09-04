import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { Task } from './task.types';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly http = inject(HttpClient);

  private readonly tasksUrl = 'assets/tasks.json';

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.tasksUrl);
  }

  getTaskById(id: number): Observable<Task | undefined> {
    return this.getTasks().pipe(
      map(tasks => tasks.find(task => task.id === id))
    );
  }
}