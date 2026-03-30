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
}

export const authService = {
  login: async (data: ILoginData): Promise<IAuthResponse> => {
    const res = await api.post("/auth/login", data);
    return res.data;
  },

  register: async (data: IRegisterData) => {
    const res = await api.post("/auth/register", data);
    return res.data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    await api.post("/auth/logout", { refreshToken });
    localStorage.clear();
  },
};
