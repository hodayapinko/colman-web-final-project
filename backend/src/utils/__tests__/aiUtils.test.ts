import {
  buildSearchablePostText,
  splitTextIntoChunks,
  calculateCosineSimilarity,
  isWithinUserRateLimit,
  isWithinGlobalRateLimit,
  getCachedSearchResponse,
  cacheSearchResponse,
} from "../aiUtils";

describe("aiUtils", () => {
  // ── buildPostText ───────────────────────────────────────

  describe("buildPostText", () => {
    it("includes all fields when present", () => {
      const text = buildSearchablePostText({
        title: "Great Hotel",
        content: "Very clean rooms.",
        location: "Paris",
        rating: 5,
        user: { username: "john" },
      });

      expect(text).toContain("Title: Great Hotel");
      expect(text).toContain("Content: Very clean rooms.");
      expect(text).toContain("Location: Paris");
      expect(text).toContain("Rating: 5");
      expect(text).toContain("Author: john");
    });

    it("omits optional fields when missing", () => {
      const text = buildSearchablePostText({
        title: "Basic",
        content: "OK stay.",
      });

      expect(text).toContain("Title: Basic");
      expect(text).toContain("Content: OK stay.");
      expect(text).not.toContain("Location");
      expect(text).not.toContain("Rating");
      expect(text).not.toContain("Author");
    });

    it("handles user as ObjectId (no username)", () => {
      const text = buildSearchablePostText({
        title: "Test",
        content: "Content",
        user: "64abc123def4567890abcdef" as any,
      });

      expect(text).not.toContain("Author");
    });
  });

  // ── splitIntoChunks ─────────────────────────────────────

  describe("splitIntoChunks", () => {
    it("returns single chunk for short text", () => {
      expect(splitTextIntoChunks("short text")).toEqual(["short text"]);
    });

    it("splits long text into multiple chunks", () => {
      const longText = "A".repeat(2000);
      const chunks = splitTextIntoChunks(longText);
      expect(chunks.length).toBeGreaterThan(1);
    });

    it("all chunks are non-empty", () => {
      const longText = "word ".repeat(300);
      const chunks = splitTextIntoChunks(longText);
      chunks.forEach((c) => expect(c.length).toBeGreaterThan(0));
    });
  });

  // ── cosineSimilarity ────────────────────────────────────

  describe("cosineSimilarity", () => {
    it("returns 1 for identical vectors", () => {
      expect(calculateCosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
    });

    it("returns 0 for orthogonal vectors", () => {
      expect(calculateCosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
    });

    it("returns 0 for zero vectors", () => {
      expect(calculateCosineSimilarity([0, 0], [0, 0])).toBe(0);
    });
  });

  // ── checkRateLimit ──────────────────────────────────────

  describe("checkRateLimit", () => {
    it("allows first request", () => {
      expect(isWithinUserRateLimit("user-rate-test-1")).toBe(true);
    });

    it("blocks after exceeding limit", () => {
      const uid = "user-rate-test-2";
      for (let i = 0; i < 5; i++) isWithinUserRateLimit(uid);
      expect(isWithinUserRateLimit(uid)).toBe(false);
    });
  });

  // ── checkGlobalLimit ────────────────────────────────────

  describe("checkGlobalLimit", () => {
    it("allows requests within limit", () => {
      expect(isWithinGlobalRateLimit()).toBe(true);
    });
  });

  // ── cache ───────────────────────────────────────────────

  describe("getCachedResult / setCachedResult", () => {
    it("returns null for missing key", () => {
      expect(getCachedSearchResponse("nonexistent")).toBeNull();
    });

    it("returns cached data after set", () => {
      cacheSearchResponse("test-key", { answer: "hi" });
      expect(getCachedSearchResponse("test-key")).toEqual({ answer: "hi" });
    });
  });
});
