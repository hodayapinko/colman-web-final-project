import Post from "../../models/Post.model";
import User from "../../models/User.model";
import { IUser, IPost } from "../../constants/constants";

export const findPostById = async (
  postId: string
): Promise<IPost | null> => {
  const post: IPost | null = await Post.findById(postId);
  return post;
};

export const findUserById = async (
  userId: string
): Promise<IUser | null> => {
  const user: IUser | null = await User.findById(userId);
  return user;
};
