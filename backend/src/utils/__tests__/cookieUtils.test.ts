import { Request, Response } from "express";
import {
  getRefreshTokenFromRequest,
  setRefreshCookie,
  clearRefreshCookie,
} from "../cookieUtils";

describe("cookieUtils", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  // ── getRefreshTokenFromRequest ───────────────────────────

  describe("getRefreshTokenFromRequest", () => {
    it("returns the token from the request body when present", () => {
      const req = {
        body: { refreshToken: "body-token" },
        cookies: {},
      } as unknown as Request;
      expect(getRefreshTokenFromRequest(req)).toBe("body-token");
    });

    it("falls back to the cookie when body has no token", () => {
      const req = {
        body: {},
        cookies: { refreshToken: "cookie-token" },
      } as unknown as Request;
      expect(getRefreshTokenFromRequest(req)).toBe("cookie-token");
    });

    it("returns undefined when neither body nor cookie has a token", () => {
      const req = {
        body: {},
        cookies: {},
      } as unknown as Request;
      expect(getRefreshTokenFromRequest(req)).toBeUndefined();
    });

    it("prioritizes body token over cookie token", () => {
      const req = {
        body: { refreshToken: "body-token" },
        cookies: { refreshToken: "cookie-token" },
      } as unknown as Request;
      expect(getRefreshTokenFromRequest(req)).toBe("body-token");
    });
  });

  // ── setRefreshCookie ─────────────────────────────────────

  describe("setRefreshCookie", () => {
    let cookieMock: jest.Mock;
    let res: Partial<Response>;

    beforeEach(() => {
      cookieMock = jest.fn();
      res = { cookie: cookieMock };
    });

    it("sets a lax, non-secure cookie in development", () => {
      process.env.NODE_ENV = "development";
      setRefreshCookie(res as Response, "dev-token");
      expect(cookieMock).toHaveBeenCalledWith("refreshToken", "dev-token", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    });

    it("sets a secure, SameSite=none cookie in production", () => {
      process.env.NODE_ENV = "production";
      setRefreshCookie(res as Response, "prod-token");
      expect(cookieMock).toHaveBeenCalledWith("refreshToken", "prod-token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    });
  });

  // ── clearRefreshCookie ───────────────────────────────────

  describe("clearRefreshCookie", () => {
    let cookieMock: jest.Mock;
    let res: Partial<Response>;

    beforeEach(() => {
      cookieMock = jest.fn();
      res = { cookie: cookieMock };
    });

    it("clears the cookie in development", () => {
      process.env.NODE_ENV = "development";
      clearRefreshCookie(res as Response);
      expect(cookieMock).toHaveBeenCalledWith("refreshToken", "", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 0,
      });
    });

    it("clears the cookie in production", () => {
      process.env.NODE_ENV = "production";
      clearRefreshCookie(res as Response);
      expect(cookieMock).toHaveBeenCalledWith("refreshToken", "", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 0,
      });
    });
  });
});
