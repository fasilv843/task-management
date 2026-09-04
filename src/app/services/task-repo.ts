import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { CommentRow, TaskComment } from './comment.types';
import { Task } from './task.types';

/**
 * The data access layer: it fetches, and does nothing else.
 *
 * No caching, no mutation, no component-facing state — that is `TaskStore`'s
 * job. Everything here is a plain read of a static JSON file standing in for an
 * HTTP endpoint, which is also why the snake_case → camelCase translation lives
 * here: it is the boundary where a wire format becomes a domain model.
 */
@Injectable({
  providedIn: 'root',
})
export class TaskRepo {
  private readonly http = inject(HttpClient);

  private readonly tasksUrl = 'assets/tasks.json';
  private readonly commentsUrl = 'assets/comments.json';

  fetchTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.tasksUrl);
  }

  fetchComments(): Observable<TaskComment[]> {
    return this.http
      .get<CommentRow[]>(this.commentsUrl)
      .pipe(map((rows) => rows.map(toTaskComment)));
  }
}

/** Maps one stored row onto the model the rest of the app works with. */
function toTaskComment(row: CommentRow): TaskComment {
  return {
    id: row.id,
    taskId: row.task_id,
    parentCommentId: row.parent_comment_id,
    text: row.text,
    createdAt: row.created_at,
  };
}
