import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { AuthController } from "../authController";
import User from "../../models/User.model";
import { TokenService } from "../../services/tokenService";
import { OAuthService } from "../../services/oauthService";
import * as cookieUtils from "../../utils/cookieUtils";
import { HTTP_STATUS } from "../../constants/constants";

jest.mock("../../models/User.model");
jest.mock("../../services/tokenService");
jest.mock("../../services/oauthService");
jest.mock("../../utils/cookieUtils");
jest.mock("bcryptjs");

describe("AuthController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = { status: statusMock };
    mockRequest = { body: {}, headers: {}, params: {} };
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      const mockUser = {
        _id: "user123",
        username: "testuser",
        email: "test@example.com",
        refreshTokens: [],
        save: jest.fn(),
      };

      mockRequest.body = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedpassword");
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (TokenService.generateTokenPair as jest.Mock).mockReturnValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      await AuthController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: "access-token",
          refreshToken: "refresh-token",
          _id: "user123",
          username: "testuser",
        })
      );
    });

    it("should return 400 if required fields are missing", async () => {
      mockRequest.body = { email: "test@example.com" };

      await AuthController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });

    it("should return 400 if username is too short", async () => {
      mockRequest.body = {
        username: "ab",
        email: "test@example.com",
        password: "password123",
      };

      await AuthController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });

    it("should return 400 if email is invalid", async () => {
      mockRequest.body = {
        username: "testuser",
        email: "invalid",
        password: "password123",
      };

      await AuthController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });

    it("should return 409 if username already exists", async () => {
      mockRequest.body = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      };

      (User.findOne as jest.Mock).mockResolvedValueOnce({ username: "testuser" });

      await AuthController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.CONFLICT);
    });

    it("should return 409 if email already exists", async () => {
      mockRequest.body = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      };

      (User.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ email: "test@example.com" });

      await AuthController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.CONFLICT);
    });

    it("should return 500 if token generation fails", async () => {
      mockRequest.body = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedpassword");
      (User.create as jest.Mock).mockResolvedValue({
        _id: "user123",
        refreshTokens: [],
        save: jest.fn(),
      });
      (TokenService.generateTokenPair as jest.Mock).mockReturnValue(null);

      await AuthController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    });
  });

  describe("login", () => {
    it("should login successfully with email", async () => {
      const mockUser = {
        _id: "user123",
        username: "testuser",
        password: "hashedpassword",
        refreshTokens: [],
        save: jest.fn(),
      };

      mockRequest.body = {
        email: "test@example.com",
        password: "password123",
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (TokenService.generateTokenPair as jest.Mock).mockReturnValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      await AuthController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: "access-token",
          refreshToken: "refresh-token",
          _id: "user123",
          username: "testuser",
        })
      );
    });

    it("should return 400 if credentials are missing", async () => {
      mockRequest.body = {};

      await AuthController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });

    it("should return 400 if user not found", async () => {
      mockRequest.body = {
        email: "test@example.com",
        password: "password123",
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);

      await AuthController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });

    it("should return 400 if password is incorrect", async () => {
      mockRequest.body = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      (User.findOne as jest.Mock).mockResolvedValue({
        _id: "user123",
        password: "hashedpassword",
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await AuthController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });

    it("should return 500 if token generation fails", async () => {
      mockRequest.body = {
        email: "test@example.com",
        password: "password123",
      };

      (User.findOne as jest.Mock).mockResolvedValue({
        _id: "user123",
        password: "hashedpassword",
        refreshTokens: [],
        save: jest.fn(),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (TokenService.generateTokenPair as jest.Mock).mockReturnValue(null);

      await AuthController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    });
  });

  describe("googleLogin", () => {
    it("should create a new user on first Google login", async () => {
      const mockGoogleUser = {
        email: "google@example.com",
        name: "Google User",
        picture: "https://example.com/pic.jpg",
        googleId: "google123",
      };

      const mockUser = {
        _id: "user123",
        username: "Google User",
        email: "google@example.com",
        profilePicture: "https://example.com/pic.jpg",
        refreshTokens: [],
        save: jest.fn(),
      };

      mockRequest.body = { credential: "google-credential" };

      (OAuthService.verifyGoogleToken as jest.Mock).mockResolvedValue(
        mockGoogleUser
      );
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (TokenService.generateTokenPair as jest.Mock).mockReturnValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      await AuthController.googleLogin(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "Google User",
          email: "google@example.com",
          googleId: "google123",
          profilePicture: "https://example.com/pic.jpg",
        })
      );
      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    it("should link googleId to existing user", async () => {
      const mockGoogleUser = {
        email: "existing@example.com",
        name: "Existing User",
        picture: "https://example.com/pic.jpg",
        googleId: "google123",
      };

      const mockUser: any = {
        _id: "user123",
        username: "existinguser",
        email: "existing@example.com",
        profilePicture: "",
        refreshTokens: [],
        save: jest.fn(),
      };

      mockRequest.body = { credential: "google-credential" };

      (OAuthService.verifyGoogleToken as jest.Mock).mockResolvedValue(
        mockGoogleUser
      );
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (TokenService.generateTokenPair as jest.Mock).mockReturnValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      await AuthController.googleLogin(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockUser.googleId).toBe("google123");
      expect(mockUser.profilePicture).toBe("https://example.com/pic.jpg");
      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    it("should return 400 if credential is missing", async () => {
      mockRequest.body = {};

      await AuthController.googleLogin(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });

    it("should cap refresh tokens at 5", async () => {
      const mockUser = {
        _id: "user123",
        username: "testuser",
        email: "test@example.com",
        googleId: "google123",
        profilePicture: "pic.jpg",
        refreshTokens: ["t1", "t2", "t3", "t4", "t5"],
        save: jest.fn(),
      };

      mockRequest.body = { credential: "google-credential" };

      (OAuthService.verifyGoogleToken as jest.Mock).mockResolvedValue({
        email: "test@example.com",
        googleId: "google123",
        picture: "pic.jpg",
      });
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (TokenService.generateTokenPair as jest.Mock).mockReturnValue({
        accessToken: "access-token",
        refreshToken: "new-refresh-token",
      });

      await AuthController.googleLogin(
        mockRequest as Request,
        mockResponse as Response
      );

      // Should have sliced to 4 + pushed 1 = 5
      expect(mockUser.refreshTokens.length).toBe(5);
      expect(
        mockUser.refreshTokens[mockUser.refreshTokens.length - 1]
      ).toBe("new-refresh-token");
    });

    it("should return 500 if token generation fails", async () => {
      mockRequest.body = { credential: "google-credential" };

      (OAuthService.verifyGoogleToken as jest.Mock).mockResolvedValue({
        email: "test@example.com",
        googleId: "google123",
      });
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue({
        _id: "user123",
        refreshTokens: [],
        save: jest.fn(),
      });
      (TokenService.generateTokenPair as jest.Mock).mockReturnValue(null);

      await AuthController.googleLogin(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    });
  });

  describe("logout", () => {
    it("should logout successfully", async () => {
      const mockUser = {
        refreshTokens: ["refresh-token"],
        save: jest.fn(),
      };

      (cookieUtils.getRefreshTokenFromRequest as jest.Mock).mockReturnValue(
        "refresh-token"
      );
      (TokenService.verifyRefreshToken as jest.Mock).mockReturnValue({
        _id: "user123",
        tokenType: "refresh",
      });
      (TokenService.extractUserIdFromToken as jest.Mock).mockReturnValue("user123");
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await AuthController.logout(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonMock).toHaveBeenCalledWith({ message: "logout success" });
      expect(cookieUtils.clearRefreshCookie).toHaveBeenCalled();
    });

    it("should logout even without refresh token", async () => {
      (cookieUtils.getRefreshTokenFromRequest as jest.Mock).mockReturnValue(
        null
      );

      await AuthController.logout(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonMock).toHaveBeenCalledWith({ message: "logout success" });
    });
  });

  describe("me", () => {
    it("should return current user", async () => {
      const mockUser = {
        _id: "user123",
        username: "testuser",
        email: "test@example.com",
        profilePicture: "pic.jpg",
      };

      (mockRequest as any).userId = "user123";
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await AuthController.me(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonMock).toHaveBeenCalledWith(mockUser);
    });

    it("should return 401 if no userId", async () => {
      (mockRequest as any).userId = undefined;

      await AuthController.me(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
    });

    it("should return 404 if user not found", async () => {
      (mockRequest as any).userId = "user123";
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await AuthController.me(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
    });
  });
});
