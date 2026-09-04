import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';

import { TaskService } from '../../services/task-service';
import { Task, TaskStatus } from '../../services/task.types';

@Component({
  selector: 'app-tasks',
  imports: [DatePipe],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
})
export class Tasks {
  private readonly taskService = inject(TaskService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly TaskStatus = TaskStatus;

  readonly tasksResource = rxResource({
    stream: () => this.taskService.getTasks(),
  });

  readonly tasks = this.tasksResource.value;

  addTask(): void {
    this.router.navigate(['create'], { relativeTo: this.route });
  }

  viewTask(task: Task): void {
    this.router.navigate([task.id], { relativeTo: this.route });
  }

  editTask(task: Task): void {
    this.router.navigate(['update', task.id], { relativeTo: this.route });
  }

  deleteTask(task: Task): void {
    const confirmed = confirm(`Delete "${task.title}"?`);
    if (!confirmed) {
      return;
    }

    this.tasksResource.update(tasks => tasks?.filter(t => t.id !== task.id));
  }
}