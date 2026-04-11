import { useEffect, useState } from "react";
import { commentService } from "../services/commentService";
import type { IPost } from "../services/postService";

export function useCommentCounts(posts: IPost[]) {
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(
    {}
  );

  useEffect(() => {
    if (posts.length === 0) return;
    Promise.all(
      posts.map((p) =>
        commentService
          .getByPost(p._id)
          .then((c) => ({ id: p._id, count: c.length }))
          .catch(() => ({ id: p._id, count: 0 }))
      )
    ).then((results) => {
      const counts: Record<string, number> = {};
      results.forEach(({ id, count }) => {
        counts[id] = count;
      });
      setCommentCounts(counts);
    });
  }, [posts]);

  return commentCounts;
}
