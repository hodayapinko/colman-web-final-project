import api from "./api";

export interface ILoginData {
  email: string;
  password: string;
}

export interface IRegisterData {
  username: string;
  email: string;
  password: string;
}

export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
  _id: string;
  username?: string;
  profilePicture?: string;
}

export const authService = {
  login: async (data: ILoginData): Promise<IAuthResponse> => {
    const res = await api.post("/auth/login", data);
    return res.data;
  },

  register: async (data: IRegisterData): Promise<IAuthResponse> => {
    const res = await api.post("/auth/register", data);
    return res.data;
  },

  googleLogin: async (credential: string): Promise<IAuthResponse> => {
    const res = await api.post("/auth/google", { credential });
    return res.data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    await api.post("/auth/logout", { refreshToken });
    localStorage.clear();
  },

  me: async () => {
    const res = await api.get("/auth/me");
    return res.data;
  },
};
