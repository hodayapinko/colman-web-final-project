import api from "./api";
import { postService } from "./postService";

export interface IUserProfile {
  _id: string;
  username: string;
  email: string;
  profilePicture?: string;
}

export const userService = {
  getById: async (id: string): Promise<IUserProfile> => {
    const res = await api.get(`/users/${id}`);
    return res.data.data;
  },

  update: async (id: string, data: Partial<IUserProfile>): Promise<IUserProfile> => {
    const res = await api.put(`/users/${id}`, data);
    return res.data.data;
  },

  uploadProfilePicture: async (file: File): Promise<string> => {
    return postService.uploadImage(file);
  },
};
