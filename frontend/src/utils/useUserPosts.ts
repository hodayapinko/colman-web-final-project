import { useEffect, useState } from "react";
import { postService, type IPost } from "../services/postService";

export function useUserPosts(userId: string | undefined, deps: unknown[] = []) {
  const [posts, setPosts] = useState<IPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    postService
      .getByUser(userId)
      .then(setPosts)
      .finally(() => setIsLoading(false));
  }, [userId, ...deps]);

  const deletePost = async (id: string) => {
    await postService.delete(id);
    setPosts((prev) => prev.filter((p) => p._id !== id));
  };

  return { posts, isLoading, deletePost };
}
