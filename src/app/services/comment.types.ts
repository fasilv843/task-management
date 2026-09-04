/**
 * A row exactly as it sits in `comments.json`: SQL column names, foreign keys by
 * id, no nesting. `parent_comment_id` is a self-reference — null at the root of
 * a thread, otherwise the comment being replied to.
 *
 * This shape exists only at the API boundary. `TaskRepo` maps it before anything
 * else in the app sees it.
 */
export interface CommentRow {
  id: number;
  task_id: number;
  parent_comment_id: number | null;
  text: string;
  created_at: string;
}

/**
 * The app-facing comment model.
 *
 * Named `TaskComment` rather than `Comment` on purpose: `Comment` is a DOM
 * global, so a file that forgets the import would silently type-check against
 * the DOM node instead of failing.
 */
export interface TaskComment {
  id: number;
  taskId: number;
  /** Null for a top-level comment, otherwise the comment this replies to. */
  parentCommentId: number | null;
  /** Plain text. Rendered with whitespace preserved, never as markup. */
  text: string;
  /** ISO 8601 timestamp. */
  createdAt: string;
}

/** Payload for a new comment. The id and timestamp are assigned by the store. */
export type CommentDraft = Pick<TaskComment, 'taskId' | 'parentCommentId' | 'text'>;

/** A comment with its replies resolved — the shape the recursive view renders. */
export interface CommentNode extends TaskComment {
  replies: CommentNode[];
  /** Nesting level, 0 at the root. Assigned while the tree is built. */
  depth: number;
}

/** A reply on its way up from the thread view to the page that saves it. */
export interface CommentReply {
  parentCommentId: number;
  text: string;
}
