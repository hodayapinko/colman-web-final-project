import { useEffect, useRef, useState } from "react";
import { commentService } from "../services/commentService";
import type { IPost } from "../services/postService";

export function useCommentCounts(posts: IPost[]) {
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const fetchedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const newPosts = posts.filter((p) => !fetchedIds.current.has(p._id));
    if (newPosts.length === 0) return;
    Promise.all(
      newPosts.map((p) =>
        commentService
          .getByPost(p._id)
          .then((c) => ({ id: p._id, count: c.length }))
          .catch(() => ({ id: p._id, count: 0 }))
      )
    ).then((results) => {
      const newCounts: Record<string, number> = {};
      results.forEach(({ id, count }) => {
        newCounts[id] = count;
        fetchedIds.current.add(id);
      });
      setCommentCounts((prev) => ({ ...prev, ...newCounts }));
    });
  }, [posts]);

  return commentCounts;
}
