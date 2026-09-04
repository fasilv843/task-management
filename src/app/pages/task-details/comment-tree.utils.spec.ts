import { TaskComment } from '../../services/comment.types';
import { buildCommentTree } from './comment-tree.utils';

function comment(
  id: number,
  parentCommentId: number | null,
  createdAt: string,
  text = `Comment ${id}`,
): TaskComment {
  return {
    id: String(id),
    taskId: '1',
    parentCommentId: parentCommentId === null ? null : String(parentCommentId),
    text,
    createdAt,
  };
}

describe('buildCommentTree', () => {
  it('returns nothing for an empty thread', () => {
    expect(buildCommentTree([])).toEqual([]);
  });

  it('keeps unparented comments as roots', () => {
    const tree = buildCommentTree([
      comment(1, null, '2026-01-01T09:00:00.000Z'),
      comment(2, null, '2026-01-01T10:00:00.000Z'),
    ]);

    expect(tree.map((node) => node.id)).toEqual(['1', '2']);
    expect(tree.every((node) => node.replies.length === 0)).toBe(true);
  });

  it('nests a chain of replies without limit and numbers the depth', () => {
    const tree = buildCommentTree([
      comment(1, null, '2026-01-01T09:00:00.000Z'),
      comment(2, 1, '2026-01-01T10:00:00.000Z'),
      comment(3, 2, '2026-01-01T11:00:00.000Z'),
      comment(4, 3, '2026-01-01T12:00:00.000Z'),
      comment(5, 4, '2026-01-01T13:00:00.000Z'),
    ]);

    expect(tree.length).toBe(1);

    const depths: number[] = [];
    const ids: string[] = [];

    for (let node = tree[0]; node !== undefined; node = node.replies[0]) {
      ids.push(node.id);
      depths.push(node.depth);
    }

    expect(ids).toEqual(['1', '2', '3', '4', '5']);
    expect(depths).toEqual([0, 1, 2, 3, 4]);
  });

  it('links a reply that appears before the comment it answers', () => {
    const tree = buildCommentTree([
      comment(2, 1, '2026-01-01T10:00:00.000Z'),
      comment(1, null, '2026-01-01T09:00:00.000Z'),
    ]);

    expect(tree.map((node) => node.id)).toEqual(['1']);
    expect(tree[0].replies.map((node) => node.id)).toEqual(['2']);
    expect(tree[0].replies[0].depth).toBe(1);
  });

  it('promotes an orphaned reply to a root rather than dropping it', () => {
    const tree = buildCommentTree([
      comment(1, null, '2026-01-01T09:00:00.000Z'),
      comment(2, 99, '2026-01-01T10:00:00.000Z'),
    ]);

    expect(tree.map((node) => node.id)).toEqual(['1', '2']);
    expect(tree[1].depth).toBe(0);
  });

  it('orders every level oldest first, whatever order the rows arrive in', () => {
    const tree = buildCommentTree([
      comment(3, 1, '2026-01-01T12:00:00.000Z'),
      comment(1, null, '2026-01-01T09:00:00.000Z'),
      comment(4, null, '2026-01-01T08:00:00.000Z'),
      comment(2, 1, '2026-01-01T10:00:00.000Z'),
    ]);

    expect(tree.map((node) => node.id)).toEqual(['4', '1']);
    expect(tree[1].replies.map((node) => node.id)).toEqual(['2', '3']);
  });

  it('does not mutate the comments it was given', () => {
    const source = comment(1, null, '2026-01-01T09:00:00.000Z');
    const tree = buildCommentTree([source]);

    tree[0].replies.push(tree[0]);

    expect(source).not.toHaveProperty('replies');
    expect(source).not.toHaveProperty('depth');
  });
});
