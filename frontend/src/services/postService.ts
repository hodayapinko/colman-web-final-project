import api from "./api";

export interface Post {
  _id: string;
  title: string;
  content: string;
  user: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostData {
  title: string;
  content: string;
  userId: string;
}

export const postService = {
  getAll: async (): Promise<Post[]> => {
    const res = await api.get("/posts");
    return res.data.data;
  },

  getById: async (id: string): Promise<Post> => {
    const res = await api.get(`/posts/${id}`);
    return res.data.data;
  },

  getByUser: async (userId: string): Promise<Post[]> => {
    const res = await api.get(`/posts?userId=${userId}`);
    return res.data.data;
  },

  create: async (data: CreatePostData) => {
    const res = await api.post("/posts", data);
    return res.data;
  },

  update: async (id: string, data: Partial<CreatePostData>) => {
    const res = await api.put(`/posts/${id}`, data);
    return res.data;
  },
};
