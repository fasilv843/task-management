import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';

import { TaskService } from '../../services/task-service';
import { TaskStatus } from '../../services/task.types';

@Component({
  selector: 'app-tasks',
  imports: [DatePipe],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
})
export class Tasks {
  private readonly taskService = inject(TaskService);

  readonly TaskStatus = TaskStatus;

  readonly tasksResource = rxResource({
    stream: () => this.taskService.getTasks(),
  });

  readonly tasks = this.tasksResource.value;
}