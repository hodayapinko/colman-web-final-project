import Post from "../../models/Post.model";
import User from "../../models/User.model";

export const findPostById = async (postId: string) => {
  const post = await Post.findById(postId);
  return post; 
};

export const findUserById = async (userId: string) => {
  const user = await User.findById(userId);
  return user;
};