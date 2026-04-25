import { Request } from "express";

// ── Auth request type (matches authMiddleware) ─────────────
export interface IAuthRequest extends Request {
  userId?: string;
}

export interface IPostSource {
  postId: string;
  title: string | undefined;
  location: string | undefined;
  rating: number | undefined;
}

export interface ISearchResponse {
  answer: string;
  sources: IPostSource[];
}

export interface IGeminiJsonResponse {
  answer: string;
  sources: number[];
}
