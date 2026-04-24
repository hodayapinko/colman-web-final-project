import { type IPost, type IPostUser } from "../services/postService";
import { API_BASE_URL } from "../services/api";

export const getPostUser = (post: IPost): IPostUser | null =>
  post.user && typeof post.user === "object" ? (post.user as IPostUser) : null;

export const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
  return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) !== 1 ? "s" : ""} ago`;
};

export const resolveImageUrl = (image: string): string =>
  image.startsWith("http") ? image : `http://${API_BASE_URL}/${image}`;
