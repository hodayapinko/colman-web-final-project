import {
  buildSearchablePostText,
  splitTextIntoChunks,
  calculateCosineSimilarity,
  isWithinUserRateLimit,
  isWithinGlobalRateLimit,
  getCachedSearchResponse,
  cacheSearchResponse,
  invalidateSearchCache,
  getGeminiClient,
  withRetry,
} from "../aiUtils";

jest.mock("@google/genai", () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({ models: {} })),
}));

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

    it("splits at sentence boundaries when present in the lookback window", () => {
      // Repeating a short sentence produces ". " patterns inside every chunk boundary
      const sentence = "This is a test sentence. ";
      const longText = sentence.repeat(50); // ~1300 chars, well above CHUNK_SIZE=900
      const chunks = splitTextIntoChunks(longText);
      expect(chunks.length).toBeGreaterThan(1);
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

    it("resets counter after rate window expires", () => {
      // Spy on Date.now to return a time far in the future so the window reset branch fires
      const farFuture = Date.now() + 61 * 1_000;
      const spy = jest.spyOn(Date, "now").mockReturnValue(farFuture);
      expect(isWithinGlobalRateLimit()).toBe(true);
      spy.mockRestore();
    });

    it("blocks requests once the global limit is exceeded", () => {
      // Force a window reset first so we start from a fresh counter
      const farFuture = Date.now() + 61 * 1_000;
      jest.spyOn(Date, "now").mockReturnValue(farFuture);
      isWithinGlobalRateLimit(); // triggers reset, count becomes 1
      jest.restoreAllMocks();

      // Exhaust remaining 9 slots (total = 10 = GLOBAL_RATE_LIMIT)
      for (let i = 0; i < 9; i++) isWithinGlobalRateLimit();
      // 11th call should be blocked
      expect(isWithinGlobalRateLimit()).toBe(false);
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

    it("returns null after cache is invalidated", () => {
      cacheSearchResponse("inv-key", { result: 42 });
      expect(getCachedSearchResponse("inv-key")).toEqual({ result: 42 });
      invalidateSearchCache();
      expect(getCachedSearchResponse("inv-key")).toBeNull();
    });
  });

  // ── getGeminiClient ─────────────────────────────────────

  describe("getGeminiClient", () => {
    const originalKey = process.env.GEMINI_API_KEY;

    afterEach(() => {
      process.env.GEMINI_API_KEY = originalKey;
      jest.restoreAllMocks();
    });

    it("returns a client instance when API key is set", () => {
      process.env.GEMINI_API_KEY = "test-key-12345678abcd";
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      const client = getGeminiClient();
      expect(client).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        "[AI] Using GEMINI_API_KEY:",
        expect.stringContaining("...")
      );
    });

    it("logs MISSING when API key is absent", () => {
      delete process.env.GEMINI_API_KEY;
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      getGeminiClient();
      expect(consoleSpy).toHaveBeenCalledWith("[AI] Using GEMINI_API_KEY:", "MISSING");
    });
  });

  // ── withRetry ───────────────────────────────────────────

  describe("withRetry", () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it("returns the result immediately on success", async () => {
      const fn = jest.fn().mockResolvedValue("ok");
      await expect(withRetry(fn, "label")).resolves.toBe("ok");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("retries after 429 and succeeds on the next attempt", async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce({ status: 429 })
        .mockResolvedValue("recovered");

      const promise = withRetry(fn, "retry-label");
      await jest.runAllTimersAsync();
      await expect(promise).resolves.toBe("recovered");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("throws immediately for non-429 errors without retrying", async () => {
      const fn = jest.fn().mockRejectedValue(new Error("network failure"));
      await expect(withRetry(fn, "err-label")).rejects.toThrow("network failure");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("rethrows 429 error after exhausting all retries", async () => {
      const fn = jest.fn().mockRejectedValue({ status: 429 });

      let caughtError: unknown;
      // Attach .catch() immediately to prevent unhandled rejection
      const promise = withRetry(fn, "exhaust-label").catch((e) => {
        caughtError = e;
      });
      await jest.runAllTimersAsync();
      await promise;

      expect(caughtError).toMatchObject({ status: 429 });
      // 1 initial attempt + 3 retries (MAX_RETRIES = 3)
      expect(fn).toHaveBeenCalledTimes(4);
    });
  });
});
