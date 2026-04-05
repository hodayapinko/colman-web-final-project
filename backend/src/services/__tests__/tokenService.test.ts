import { TokenService } from "../tokenService";

describe("TokenService", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.ACCESS_TOKEN_SECRET = "test-access-secret";
    process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("generateTokenPair", () => {
    it("should generate access and refresh tokens", () => {
      const pair = TokenService.generateTokenPair("user123");
      expect(pair).not.toBeNull();
      expect(pair!.accessToken).toBeDefined();
      expect(pair!.refreshToken).toBeDefined();
    });

    it("should throw if ACCESS_TOKEN_SECRET is missing", () => {
      delete process.env.ACCESS_TOKEN_SECRET;

      expect(() => TokenService.generateTokenPair("user123")).toThrow("Missing ACCESS_TOKEN_SECRET");
    });

    it("should throw if REFRESH_TOKEN_SECRET is missing", () => {
      delete process.env.REFRESH_TOKEN_SECRET;

      expect(() => TokenService.generateTokenPair("user123")).toThrow("Missing REFRESH_TOKEN_SECRET");
    });

    it("should throw if both secrets are missing", () => {
      delete process.env.ACCESS_TOKEN_SECRET;
      delete process.env.REFRESH_TOKEN_SECRET;

      expect(() => TokenService.generateTokenPair("user123")).toThrow();
    });
  });

  describe("verifyAccessToken", () => {
    it("should verify an access token", () => {
      const pair = TokenService.generateTokenPair("user123");
      const payload = TokenService.verifyAccessToken(pair!.accessToken);

      expect(payload._id).toBe("user123");
      expect(payload.tokenType).toBe("access");
    });

    it("should reject an invalid token", () => {
      expect(() =>
        TokenService.verifyAccessToken("invalid-token")
      ).toThrow();
    });

    it("should throw if ACCESS_TOKEN_SECRET is missing", () => {
      delete process.env.ACCESS_TOKEN_SECRET;

      expect(() =>
        TokenService.verifyAccessToken("some-token")
      ).toThrow("Missing ACCESS_TOKEN_SECRET");
    });
  });

  describe("verifyRefreshToken", () => {
    it("should verify a refresh token", () => {
      const pair = TokenService.generateTokenPair("user123");
      const payload = TokenService.verifyRefreshToken(pair!.refreshToken);

      expect(payload._id).toBe("user123");
      expect(payload.tokenType).toBe("refresh");
    });

    it("should reject an invalid token", () => {
      expect(() =>
        TokenService.verifyRefreshToken("invalid-token")
      ).toThrow();
    });

    it("should throw if REFRESH_TOKEN_SECRET is missing", () => {
      delete process.env.REFRESH_TOKEN_SECRET;

      expect(() =>
        TokenService.verifyRefreshToken("some-token")
      ).toThrow("Missing REFRESH_TOKEN_SECRET");
    });
  });

  describe("extractUserId", () => {
    it("should extract user ID from payload", () => {
      const pair = TokenService.generateTokenPair("user123");
      const payload = TokenService.verifyAccessToken(pair!.accessToken);

      expect(TokenService.extractUserIdFromToken(payload)).toBe("user123");
    });
  });
});
