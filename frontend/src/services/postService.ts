import api from "./api";

export interface PostUser {
  _id: string;
  username: string;
  profilePicture?: string;
}

export interface Post {
  _id: string;
  title: string;
  content: string;
  image?: string;
  location?: string;
  rating?: number;
  user: string | PostUser;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostData {
  title: string;
  content: string;
  userId: string;
  image?: string;
  location?: string;
  rating?: number;
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

  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/file", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.url;
  },

  update: async (id: string, data: Partial<CreatePostData>) => {
    const res = await api.put(`/posts/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete(`/posts/${id}`);
    return res.data;
  },
};
