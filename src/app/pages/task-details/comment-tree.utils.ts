import { CommentNode, TaskComment } from '../../services/comment.types';

/**
 * Turns the flat comment rows into the nested structure the thread renders.
 *
 * Storage is a flat table with a self-referencing `parentCommentId`, which is
 * what makes nesting unbounded — depth is a property of the data, not of the
 * schema. This rebuilds the tree on read in two passes, so it stays linear no
 * matter how deep a thread runs.
 */
export function buildCommentTree(comments: readonly TaskComment[]): CommentNode[] {
  const nodesById = new Map<string, CommentNode>(
    comments.map((comment) => [comment.id, { ...comment, replies: [], depth: 0 }]),
  );

  const roots: CommentNode[] = [];

  for (const comment of comments) {
    const node = nodesById.get(comment.id);

    if (!node) {
      continue;
    }

    const parent =
      comment.parentCommentId === null ? undefined : nodesById.get(comment.parentCommentId);

    if (parent) {
      parent.replies.push(node);
    } else {
      // Either a genuine top-level comment, or one whose parent is not in this
      // set. An orphan is promoted to a root rather than dropped — a dangling
      // foreign key must not make a comment disappear from the page.
      roots.push(node);
    }
  }

  // Depth is assigned by walking down from the roots, so the view never has to
  // count ancestors. Done after linking, because a reply can appear in the
  // input before the comment it answers.
  assignDepth(roots, 0);
  sortByCreatedAt(roots);

  return roots;
}

function assignDepth(nodes: readonly CommentNode[], depth: number): void {
  for (const node of nodes) {
    node.depth = depth;
    assignDepth(node.replies, depth + 1);
  }
}

/** Oldest first at every level, so a new comment lands at the bottom of its thread. */
function sortByCreatedAt(nodes: CommentNode[]): void {
  nodes.sort((first, second) => first.createdAt.localeCompare(second.createdAt));

  for (const node of nodes) {
    sortByCreatedAt(node.replies);
  }
}
