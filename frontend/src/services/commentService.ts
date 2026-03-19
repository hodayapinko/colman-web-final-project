import api from "./api";

export interface Comment {
  _id: string;
  content: string;
  postId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentData {
  postId: string;
  content: string;
  userId: string;
}

export const commentService = {
  getByPost: async (postId: string): Promise<Comment[]> => {
    const res = await api.get(`/comments/post/${postId}`);
    return res.data.data;
  },

  create: async (data: CreateCommentData) => {
    const res = await api.post("/comments", data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete(`/comments/${id}`);
    return res.data;
  },
};
