import api from "./api";

export interface IAiSource {
  postId: string;
  title?: string | null;
  location?: string | null;
  rating?: number | null;
}

export interface IAiSearchResponse {
  answer: string;
  sources: IAiSource[];
}

export const aiService = {
  search: async (query: string): Promise<IAiSearchResponse> => {
    const res = await api.post("/ai/search", { query });
    return res.data;
  },
};
