import {
  generateTextEmbedding,
  indexPostEmbedding,
  removePostEmbedding,
  findRelevantChunks,
  reindexAllPostEmbeddings,
} from "../embedding";

jest.mock("../../utils/aiUtils", () => ({
  getGeminiClient: jest.fn(() => ({
    models: {
      embedContent: jest.fn().mockResolvedValue({
        embeddings: [{ values: [0.1, 0.2, 0.3] }],
      }),
    },
  })),
  buildSearchablePostText: jest.fn(() => "Title: Test. Content: Hello"),
  splitTextIntoChunks: jest.fn((text: string) => [text]),
  calculateCosineSimilarity: jest.fn(() => 0.95),
  delay: jest.fn(() => Promise.resolve()),
  REINDEX_DELAY: 3000,
  REINDEX_ERROR_DELAY: 10000,
}));

jest.mock("../../models/Emmbeding", () => ({
  __esModule: true,
  default: {
    bulkWrite: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn().mockResolvedValue({}),
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { post: { toString: () => "p1" }, chunkIndex: 0, content: "chunk1", embedding: [0.1, 0.2, 0.3] },
      ]),
    }),
    distinct: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock("../../models/Post.model", () => ({
  __esModule: true,
  default: {
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: { toString: () => "p1" }, title: "Test Post", content: "Hello", user: { username: "john" } },
        ]),
      }),
    }),
  },
}));

describe("embedding service", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("generateEmbedding", () => {
    it("returns embedding values", async () => {
      const result = await generateTextEmbedding("test text");
      expect(result).toEqual([0.1, 0.2, 0.3]);
    });
  });

  describe("upsertPostEmbedding", () => {
    it("calls bulkWrite and deleteMany", async () => {
      const Embedding = require("../../models/Emmbeding").default;

      await indexPostEmbedding({
        _id: "p1",
        title: "Test",
        content: "Hello",
        user: { username: "john" },
      } as any);

      expect(Embedding.bulkWrite).toHaveBeenCalled();
      expect(Embedding.deleteMany).toHaveBeenCalled();
    });
  });

  describe("deletePostEmbedding", () => {
    it("deletes embeddings for a post", async () => {
      const Embedding = require("../../models/Emmbeding").default;

      await removePostEmbedding("p1");

      expect(Embedding.deleteMany).toHaveBeenCalledWith({ post: "p1" });
    });
  });

  describe("findSimilarChunks", () => {
    it("returns scored chunks sorted by similarity", async () => {
      const results = await findRelevantChunks("query", 5);

      expect(results.length).toBe(1);
      expect(results[0].postId).toBe("p1");
      expect(results[0].score).toBe(0.95);
    });
  });

  describe("reindexAllPosts", () => {
    it("indexes posts that have no embeddings", async () => {
      const result = await reindexAllPostEmbeddings();

      expect(result.indexed).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
    });
  });
});
