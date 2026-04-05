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

    it("should return null if ACCESS_TOKEN_SECRET is missing", () => {
      delete process.env.ACCESS_TOKEN_SECRET;

      const pair = TokenService.generateTokenPair("user123");
      expect(pair).toBeNull();
    });

    it("should return null if REFRESH_TOKEN_SECRET is missing", () => {
      delete process.env.REFRESH_TOKEN_SECRET;

      const pair = TokenService.generateTokenPair("user123");
      expect(pair).toBeNull();
    });

    it("should return null if both secrets are missing", () => {
      delete process.env.ACCESS_TOKEN_SECRET;
      delete process.env.REFRESH_TOKEN_SECRET;

      const pair = TokenService.generateTokenPair("user123");
      expect(pair).toBeNull();
    });
  });

  describe("verifyToken", () => {
    it("should verify an access token", async () => {
      const pair = TokenService.generateTokenPair("user123");
      const payload = await TokenService.verifyToken(pair!.accessToken);

      expect(payload._id).toBe("user123");
      expect(payload.tokenType).toBe("access");
    });

    it("should verify a refresh token", async () => {
      const pair = TokenService.generateTokenPair("user123");
      const payload = await TokenService.verifyToken(pair!.refreshToken);

      expect(payload._id).toBe("user123");
      expect(payload.tokenType).toBe("refresh");
    });

    it("should reject an invalid token", async () => {
      await expect(
        TokenService.verifyToken("invalid-token")
      ).rejects.toThrow();
    });

    it("should throw if secrets are missing", async () => {
      delete process.env.ACCESS_TOKEN_SECRET;
      delete process.env.REFRESH_TOKEN_SECRET;

      await expect(
        TokenService.verifyToken("some-token")
      ).rejects.toThrow("Token secrets are not defined");
    });
  });

  describe("assertTokenType", () => {
    it("should not throw for matching token type", async () => {
      const pair = TokenService.generateTokenPair("user123");
      const payload = await TokenService.verifyToken(pair!.accessToken);

      expect(() =>
        TokenService.assertTokenType(payload, "access")
      ).not.toThrow();
    });

    it("should throw for mismatched token type", async () => {
      const pair = TokenService.generateTokenPair("user123");
      const payload = await TokenService.verifyToken(pair!.accessToken);

      expect(() =>
        TokenService.assertTokenType(payload, "refresh")
      ).toThrow("Invalid token type");
    });
  });

  describe("extractUserId", () => {
    it("should extract user ID from payload", async () => {
      const pair = TokenService.generateTokenPair("user123");
      const payload = await TokenService.verifyToken(pair!.accessToken);

      expect(TokenService.extractUserId(payload)).toBe("user123");
    });
  });
});
