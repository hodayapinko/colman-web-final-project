import { Response } from "express";
import Post from "../../models/Post.model";
import { aiSearch, reindexPosts } from "../ai.controller";
import { HTTP_STATUS } from "../../constants/constants";
import { findSimilarChunks, reindexAllPosts } from "../../services/embedding";
import {
  buildAiPrompt,
  getCachedResponse,
  getGeminiClient,
  isWithinGlobalRateLimit,
  isWithinUserRateLimit,
  parseGeminiResponse,
  setCachedResponse,
} from "../../utils/aiUtils";

jest.mock("../../models/Post.model");
jest.mock("../../services/embedding");
jest.mock("../../utils/aiUtils", () => ({
  TOP_K_SIMILAR_CHUNKS: 5,
  buildAiPrompt: jest.fn(),
  getCachedResponse: jest.fn(),
  setCachedResponse: jest.fn(),
  isWithinUserRateLimit: jest.fn(),
  isWithinGlobalRateLimit: jest.fn(),
  getGeminiClient: jest.fn(),
  parseGeminiResponse: jest.fn(),
}));

describe("AI Controller", () => {
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = { status: statusMock, json: jsonMock };

    (getCachedResponse as jest.Mock).mockReturnValue(null);
    (setCachedResponse as jest.Mock).mockImplementation(() => undefined);
    (isWithinUserRateLimit as jest.Mock).mockReturnValue(true);
    (isWithinGlobalRateLimit as jest.Mock).mockReturnValue(true);
    (buildAiPrompt as jest.Mock).mockReturnValue("PROMPT");

    jest.clearAllMocks();
  });

  describe("aiSearch", () => {
    it("returns 400 when query is missing", async () => {
      const mockRequest: any = { body: {}, userId: "u1" };

      await aiSearch(mockRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Search query is required." });
    });

    it("returns cached response when present", async () => {
      const cached = { answer: "cached", sources: [] };
      (getCachedResponse as jest.Mock).mockReturnValue(cached);

      const mockRequest: any = { body: { query: "hi" }, userId: "u1" };
      await aiSearch(mockRequest, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(cached);
      expect(findSimilarChunks).not.toHaveBeenCalled();
    });

    it("returns 429 when user rate limited", async () => {
      (isWithinUserRateLimit as jest.Mock).mockReturnValue(false);

      const mockRequest: any = { body: { query: "hi" }, userId: "u1" };
      await aiSearch(mockRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.TOO_MANY_REQUESTS);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Too many requests — please wait a moment.",
      });
    });

    it("returns empty sources when no similar chunks found", async () => {
      (findSimilarChunks as jest.Mock).mockResolvedValue([]);

      const mockRequest: any = { body: { query: "paris" }, userId: "u1" };
      await aiSearch(mockRequest, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        answer: "No relevant hotel reviews found.",
        sources: [],
      });
    });

    it("returns answer and mapped sources on success", async () => {
      (findSimilarChunks as jest.Mock).mockResolvedValue([
        { postId: "p1", chunkIndex: 0, content: "c1", score: 0.9 },
      ]);

      (Post.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            { _id: "p1", location: "Paris", rating: 5 },
          ]),
        }),
      });

      (getGeminiClient as jest.Mock).mockResolvedValue({
        models: {
          generateContent: jest.fn().mockResolvedValue({ text: "RAW" }),
        },
      });

      (parseGeminiResponse as jest.Mock).mockReturnValue({
        answer: "Try Paris",
        sources: [1],
      });

      const mockRequest: any = { body: { query: "best" }, userId: "u1" };
      await aiSearch(mockRequest, mockResponse as Response);

      expect(setCachedResponse).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({
        answer: "Try Paris",
        sources: [{ postId: "p1", location: "Paris", rating: 5 }],
      });
    });

    it("returns 429 busy when downstream throws status 429", async () => {
      (findSimilarChunks as jest.Mock).mockResolvedValue([
        { postId: "p1", chunkIndex: 0, content: "c1", score: 0.9 },
      ]);

      (Post.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([{ _id: "p1", location: "Paris", rating: 5 }]),
        }),
      });

      (getGeminiClient as jest.Mock).mockResolvedValue({
        models: {
          generateContent: jest.fn().mockRejectedValue({ status: 429, message: "busy" }),
        },
      });

      const mockRequest: any = { body: { query: "best" }, userId: "u1" };
      await aiSearch(mockRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.TOO_MANY_REQUESTS);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "AI service is busy — please retry in a few seconds.",
      });
    });
  });

  describe("reindexPosts", () => {
    it("returns reindex result", async () => {
      (reindexAllPosts as jest.Mock).mockResolvedValue({ indexed: 1, skipped: 2, errors: 0 });

      const mockRequest: any = { userId: "u1", query: {} };
      await reindexPosts(mockRequest, mockResponse as Response);

      expect(reindexAllPosts).toHaveBeenCalledWith(false);
      expect(jsonMock).toHaveBeenCalledWith({ indexed: 1, skipped: 2, errors: 0 });
    });

    it("passes force=true when query param is set", async () => {
      (reindexAllPosts as jest.Mock).mockResolvedValue({ indexed: 3, skipped: 0, errors: 0 });

      const mockRequest: any = { userId: "u1", query: { force: "true" } };
      await reindexPosts(mockRequest, mockResponse as Response);

      expect(reindexAllPosts).toHaveBeenCalledWith(true);
      expect(jsonMock).toHaveBeenCalledWith({ indexed: 3, skipped: 0, errors: 0 });
    });

    it("returns 500 when reindex fails", async () => {
      (reindexAllPosts as jest.Mock).mockRejectedValue(new Error("fail"));

      const mockRequest: any = { userId: "u1", query: {} };
      await reindexPosts(mockRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Reindex posts failed." });
    });
  });
});
