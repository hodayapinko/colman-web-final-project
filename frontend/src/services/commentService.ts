import api from "./api";

export interface ICommentUser {
  _id: string;
  username: string;
  profilePicture?: string;
}

export interface IComment {
  _id: string;
  content: string;
  postId: string;
  userId: string | ICommentUser;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateCommentData {
  postId: string;
  content: string;
  userId: string;
}

export const commentService = {
  getByPost: async (postId: string): Promise<IComment[]> => {
    const res = await api.get(`/comments/post/${postId}`);
    return res.data.data;
  },

  create: async (data: ICreateCommentData) => {
    const res = await api.post("/comments", data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete(`/comments/${id}`);
    return res.data;
  },
};
