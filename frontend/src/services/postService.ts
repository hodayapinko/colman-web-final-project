import api from "./api";

export interface IPostUser {
  _id: string;
  username: string;
  profilePicture?: string;
}

export interface IPost {
  _id: string;
  title: string;
  content: string;
  image?: string;
  location?: string;
  rating?: number;
  user: string | IPostUser;
  createdAt: string;
  updatedAt: string;
}

export interface ICreatePostData {
  title: string;
  content: string;
  userId: string;
  image?: string;
  location?: string;
  rating?: number;
}

export const postService = {
  getAll: async (): Promise<IPost[]> => {
    const res = await api.get("/posts");
    return res.data.data;
  },

  getById: async (id: string): Promise<IPost> => {
    const res = await api.get(`/posts/${id}`);
    return res.data.data;
  },

  getByUser: async (userId: string): Promise<IPost[]> => {
    const res = await api.get(`/posts?userId=${userId}`);
    return res.data.data;
  },

  create: async (data: ICreatePostData) => {
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

  update: async (id: string, data: Partial<ICreatePostData>) => {
    const res = await api.put(`/posts/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete(`/posts/${id}`);
    return res.data;
  },
};
