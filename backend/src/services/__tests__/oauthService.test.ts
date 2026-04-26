import { OAuthService } from "../oauthService";
import { OAuth2Client } from "google-auth-library";

jest.mock("google-auth-library");
jest.mock("../../models/User.model", () => ({}));

const MockedOAuth2Client = OAuth2Client as unknown as jest.MockedClass<typeof OAuth2Client>;

describe("OAuthService", () => {
  const originalEnv = process.env;
  let mockVerifyIdToken: jest.Mock;

  beforeEach(() => {
    process.env = { ...originalEnv, GOOGLE_CLIENT_ID: "test-client-id" };
    // Reset the private static client so each test starts fresh
    (OAuthService as any).client = null;
    jest.clearAllMocks();

    mockVerifyIdToken = jest.fn();
    MockedOAuth2Client.mockImplementation(() => ({
      verifyIdToken: mockVerifyIdToken,
    }) as any);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ── verifyGoogleToken ────────────────────────────────────

  describe("verifyGoogleToken", () => {
    it("returns a parsed user payload for a valid token", async () => {
      const mockPayload = {
        email: "user@example.com",
        name: "Test User",
        picture: "https://example.com/avatar.jpg",
        email_verified: true,
        sub: "google-uid-123",
      };
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => mockPayload,
      });

      const result = await OAuthService.verifyGoogleToken("valid-id-token");

      expect(result).toEqual({
        email: "user@example.com",
        name: "Test User",
        picture: "https://example.com/avatar.jpg",
        email_verified: true,
        googleId: "google-uid-123",
      });
    });

    it("throws 'Invalid Google token' when verifyIdToken rejects", async () => {
      mockVerifyIdToken.mockRejectedValue(new Error("signature mismatch"));

      await expect(OAuthService.verifyGoogleToken("bad-token")).rejects.toThrow(
        "Invalid Google token"
      );
    });

    it("throws 'Invalid token payload' when the ticket payload is null", async () => {
      mockVerifyIdToken.mockResolvedValue({ getPayload: () => null });

      await expect(OAuthService.verifyGoogleToken("null-payload")).rejects.toThrow(
        "Invalid token payload"
      );
    });

    it("throws 'Invalid token payload' when the payload has no email", async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({ name: "No Email", sub: "uid-456" }),
      });

      await expect(OAuthService.verifyGoogleToken("no-email-token")).rejects.toThrow(
        "Invalid token payload"
      );
    });

    it("throws 'Invalid Google token' when GOOGLE_CLIENT_ID is not set", async () => {
      delete process.env.GOOGLE_CLIENT_ID;
      (OAuthService as any).client = null;

      await expect(OAuthService.verifyGoogleToken("any-token")).rejects.toThrow(
        "Invalid Google token"
      );
    });

    it("reuses the same OAuth2Client instance on subsequent calls", async () => {
      const mockPayload = {
        email: "a@b.com",
        sub: "uid-789",
        email_verified: true,
      };
      mockVerifyIdToken.mockResolvedValue({ getPayload: () => mockPayload });

      await OAuthService.verifyGoogleToken("token-1");
      await OAuthService.verifyGoogleToken("token-2");

      // Constructor should only have been called once (singleton)
      expect(MockedOAuth2Client).toHaveBeenCalledTimes(1);
    });
  });
});
