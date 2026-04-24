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
  likes: string[];
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

export interface IPaginatedPosts {
  data: IPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export const postService = {
  getAll: async (page = 1, limit = 10): Promise<IPaginatedPosts> => {
    const res = await api.get(`/posts?page=${page}&limit=${limit}`);
    return { data: res.data.data, pagination: res.data.pagination };
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

  toggleLike: async (
    id: string,
    userId: string,
  ): Promise<{ likes: string[]; liked: boolean }> => {
    const res = await api.put(`/posts/${id}/like`, { userId });
    return res.data.data;
  },
};
