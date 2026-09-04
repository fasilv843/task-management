import { Injectable, inject, signal, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, tap } from 'rxjs';

import { Task, TaskDraft } from './task.types';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly http = inject(HttpClient);

  private readonly tasksUrl = 'assets/tasks.json';

  /**
   * In-memory store, seeded once from the static JSON file. There is no write
   * endpoint behind `assets/tasks.json`, so created and edited tasks live here
   * for the lifetime of the session.
   */
  private readonly tasks = signal<Task[] | null>(null);

  getTasks(): Observable<Task[]> {
    // Read untracked: `rxResource` evaluates its stream factory in a reactive
    // context, and a tracked read here would re-trigger the resource on every
    // store mutation.
    const cachedTasks = untracked(this.tasks);

    if (cachedTasks) {
      return of(cachedTasks);
    }

    return this.http.get<Task[]>(this.tasksUrl).pipe(tap((tasks) => this.tasks.set(tasks)));
  }

  getTaskById(id: number): Observable<Task | undefined> {
    return this.getTasks().pipe(map((tasks) => tasks.find((task) => task.id === id)));
  }

  createTask(draft: TaskDraft): Observable<Task> {
    // Piping off getTasks() seeds the store first, so this works even when the
    // form is opened directly without visiting the list page.
    return this.getTasks().pipe(
      map((tasks) => {
        const nextId = tasks.reduce((highest, task) => Math.max(highest, task.id), 0) + 1;
        const created: Task = { ...draft, id: nextId };

        this.tasks.set([...tasks, created]);

        return created;
      }),
    );
  }

  updateTask(id: number, draft: TaskDraft): Observable<Task> {
    return this.getTasks().pipe(
      map((tasks) => {
        const index = tasks.findIndex((task) => task.id === id);

        if (index === -1) {
          throw new Error(`Task ${id} no longer exists.`);
        }

        const updated: Task = { ...draft, id };
        const nextTasks = [...tasks];
        nextTasks[index] = updated;

        this.tasks.set(nextTasks);

        return updated;
      }),
    );
  }

  deleteTask(id: number): Observable<void> {
    return this.getTasks().pipe(
      map((tasks) => {
        this.tasks.set(tasks.filter((task) => task.id !== id));
      }),
    );
  }
}
