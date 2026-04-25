import {
  generateEmbedding,
  upsertPostEmbedding,
  deletePostEmbedding,
  findSimilarChunks,
  reindexAllPosts,
} from "../embedding";

jest.mock("../../utils/aiUtils", () => ({
  getGenAI: jest.fn(() => ({
    models: {
      embedContent: jest.fn().mockResolvedValue({
        embeddings: [{ values: [0.1, 0.2, 0.3] }],
      }),
    },
  })),
  buildPostText: jest.fn(() => "Title: Test. Content: Hello"),
  splitIntoChunks: jest.fn((text: string) => [text]),
  cosineSimilarity: jest.fn(() => 0.95),
  delay: jest.fn(() => Promise.resolve()),
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
      const result = await generateEmbedding("test text");
      expect(result).toEqual([0.1, 0.2, 0.3]);
    });
  });

  describe("upsertPostEmbedding", () => {
    it("calls bulkWrite and deleteMany", async () => {
      const Embedding = require("../../models/Emmbeding").default;

      await upsertPostEmbedding({
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

      await deletePostEmbedding("p1");

      expect(Embedding.deleteMany).toHaveBeenCalledWith({ post: "p1" });
    });
  });

  describe("findSimilarChunks", () => {
    it("returns scored chunks sorted by similarity", async () => {
      const results = await findSimilarChunks("query", 5);

      expect(results.length).toBe(1);
      expect(results[0].postId).toBe("p1");
      expect(results[0].score).toBe(0.95);
    });
  });

  describe("reindexAllPosts", () => {
    it("indexes posts that have no embeddings", async () => {
      const result = await reindexAllPosts();

      expect(result.indexed).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
    });
  });
});
