import { Response } from "express";
import { handleAiSearch, handleReindexPosts } from "../ai.controller";
import { HTTP_STATUS } from "../../constants/constants";
import { findRelevantChunks, reindexAllPostEmbeddings } from "../../services/embedding";
import {
  getGeminiClient,
  isWithinUserRateLimit,
  isWithinGlobalRateLimit,
  getCachedSearchResponse,
  cacheSearchResponse,
} from "../../utils/aiUtils";

jest.mock("../../models/Post.model");
jest.mock("../../services/embedding");
jest.mock("../../utils/aiUtils", () => ({
  getGeminiClient: jest.fn(),
  isWithinUserRateLimit: jest.fn().mockReturnValue(true),
  isWithinGlobalRateLimit: jest.fn().mockReturnValue(true),
  getCachedSearchResponse: jest.fn().mockReturnValue(null),
  cacheSearchResponse: jest.fn(),
}));

import Post from "../../models/Post.model";

describe("AI Controller", () => {
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRes = { status: statusMock, json: jsonMock };
    jest.clearAllMocks();

    (isWithinUserRateLimit as jest.Mock).mockReturnValue(true);
    (isWithinGlobalRateLimit as jest.Mock).mockReturnValue(true);
    (getCachedSearchResponse as jest.Mock).mockReturnValue(null);
  });

  describe("aiSearch", () => {
    it("returns 400 when query is missing", async () => {
      await handleAiSearch({ body: {}, userId: "u1" } as any, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Search query is required." });
    });

    it("returns 400 when query is empty string", async () => {
      await handleAiSearch({ body: { query: "   " }, userId: "u1" } as any, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });

    it("returns cached response when available", async () => {
      const cached = { answer: "cached answer", sources: [] };
      (getCachedSearchResponse as jest.Mock).mockReturnValue(cached);

      await handleAiSearch({ body: { query: "test" }, userId: "u1" } as any, mockRes as Response);

      expect(jsonMock).toHaveBeenCalledWith(cached);
      expect(findRelevantChunks).not.toHaveBeenCalled();
    });

    it("returns 429 when user rate limited", async () => {
      (isWithinUserRateLimit as jest.Mock).mockReturnValue(false);

      await handleAiSearch({ body: { query: "test" }, userId: "u1" } as any, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.TOO_MANY_REQUESTS);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Too many AI requests. Please wait a moment." });
    });

    it("returns 429 when global rate limited", async () => {
      (isWithinGlobalRateLimit as jest.Mock).mockReturnValue(false);

      await handleAiSearch({ body: { query: "test" }, userId: "u1" } as any, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.TOO_MANY_REQUESTS);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Server is reaching capacity. Try again in a minute." });
    });


    it("returns empty when no chunks found", async () => {
      (findRelevantChunks as jest.Mock).mockResolvedValue([]);

      await handleAiSearch({ body: { query: "paris" }, userId: "u1" } as any, mockRes as Response);

      expect(jsonMock).toHaveBeenCalledWith({ answer: "No data available to search.", sources: [] });
    });

    it("returns answer and sources on success", async () => {
      (findRelevantChunks as jest.Mock).mockResolvedValue([
        { postId: "p1", chunkIndex: 0, content: "Great hotel", score: 0.9 },
      ]);

      (Post.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            { _id: { toString: () => "p1" }, title: "Nice Hotel", location: "Paris", rating: 5 },
          ]),
        }),
      });

      const mockGenAI = {
        models: {
          generateContent: jest.fn().mockResolvedValue({
            text: '{"answer":"Try Paris","sources":[1]}',
          }),
        },
      };
      (getGeminiClient as jest.Mock).mockReturnValue(mockGenAI);

      await handleAiSearch({ body: { query: "best hotel" }, userId: "u1" } as any, mockRes as Response);

      expect(cacheSearchResponse).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({
        answer: "Try Paris",
        sources: [{ postId: "p1", title: "Nice Hotel", location: "Paris", rating: 5 }],
      });
    });

    it("handles unparseable Gemini response gracefully", async () => {
      (findRelevantChunks as jest.Mock).mockResolvedValue([
        { postId: "p1", chunkIndex: 0, content: "c1", score: 0.9 },
      ]);

      (Post.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            { _id: { toString: () => "p1" }, title: "T", location: "L", rating: 3 },
          ]),
        }),
      });

      (getGeminiClient as jest.Mock).mockReturnValue({
        models: {
          generateContent: jest.fn().mockResolvedValue({ text: "not json at all" }),
        },
      });

      await handleAiSearch({ body: { query: "test" }, userId: "u1" } as any, mockRes as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        answer: "Could not process search. Please try a different query.",
        sources: [],
      });
    });

    it("returns 429 when downstream API throws 429", async () => {
      (findRelevantChunks as jest.Mock).mockResolvedValue([
        { postId: "p1", chunkIndex: 0, content: "c1", score: 0.9 },
      ]);

      (Post.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            { _id: { toString: () => "p1" }, title: "T", location: "L", rating: 3 },
          ]),
        }),
      });

      (getGeminiClient as jest.Mock).mockReturnValue({
        models: {
          generateContent: jest.fn().mockRejectedValue({ status: 429, message: "busy" }),
        },
      });

      await handleAiSearch({ body: { query: "test" }, userId: "u1" } as any, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.TOO_MANY_REQUESTS);
    });

    it("returns 500 on unexpected error", async () => {
      (findRelevantChunks as jest.Mock).mockRejectedValue(new Error("db down"));

      await handleAiSearch({ body: { query: "test" }, userId: "u1" } as any, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(jsonMock).toHaveBeenCalledWith({ message: "AI search failed. Please try again." });
    });
  });

  describe("reindexPosts", () => {
    it("returns reindex result on success", async () => {
      (reindexAllPostEmbeddings as jest.Mock).mockResolvedValue({ indexed: 2, skipped: 1, errors: 0 });

      await handleReindexPosts({} as any, mockRes as Response);

      expect(jsonMock).toHaveBeenCalledWith({ indexed: 2, skipped: 1, errors: 0 });
    });

    it("returns 500 on failure", async () => {
      (reindexAllPostEmbeddings as jest.Mock).mockRejectedValue(new Error("fail"));

      await handleReindexPosts({} as any, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Reindex failed." });
    });
  });
});
