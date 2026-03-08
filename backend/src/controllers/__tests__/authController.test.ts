import { Request, Response } from "express";
import authController from "../authController";
import User from "../../models/User.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

jest.mock("../../models/User.model");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

describe("Auth Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    sendMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ send: sendMock });
    mockResponse = {
      status: statusMock,
      send: sendMock,
    };
    mockRequest = { body: {} };
    process.env.TOKEN_SECRET = "test-secret";
    process.env.TOKEN_EXPIRES = "1h";
    process.env.REFRESH_TOKEN_EXPIRES = "7d";
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        username: "testuser",
        email: "test@example.com",
        password: "hashedPassword123",
        refreshTokens: [],
      };

      mockRequest.body = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      };

      (bcrypt.genSalt as jest.Mock).mockResolvedValue("salt");
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword123");
      (User.create as jest.Mock).mockResolvedValue(mockUser);

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", "salt");
      expect(User.create).toHaveBeenCalledWith({
        username: "testuser",
        email: "test@example.com",
        password: "hashedPassword123",
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(sendMock).toHaveBeenCalledWith({
        _id: mockUser._id,
        username: mockUser.username,
        email: mockUser.email,
      });
    });

    it("should handle registration errors", async () => {
      mockRequest.body = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      };

      const error = new Error("Database error");
      (bcrypt.genSalt as jest.Mock).mockResolvedValue("salt");
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword123");
      (User.create as jest.Mock).mockRejectedValue(error);

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(sendMock).toHaveBeenCalledWith(error);
    });

    it("should handle bcrypt errors", async () => {
      mockRequest.body = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      };

      const error = new Error("Bcrypt error");
      (bcrypt.genSalt as jest.Mock).mockRejectedValue(error);

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(sendMock).toHaveBeenCalledWith(error);
    });
    it("should return 400 if username is missing", async () => {
      mockRequest.body = {
        email: "test@example.com",
        password: "password123",
      };

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(sendMock).toHaveBeenCalledWith({
        message: "missing username, email or password",
      });
    });

    it("should return 400 if email is missing", async () => {
      mockRequest.body = {
        username: "testuser",
        password: "password123",
      };

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(sendMock).toHaveBeenCalledWith({
        message: "missing username, email or password",
      });
    });

    it("should return 400 if password is missing", async () => {
      mockRequest.body = {
        username: "testuser",
        email: "test@example.com",
      };

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(sendMock).toHaveBeenCalledWith({
        message: "missing username, email or password",
      });
    });
  });

  describe("login", () => {
    it("should login successfully with valid credentials", async () => {
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
        password: "hashedPassword123",
        refreshTokens: [],
        save: jest.fn().mockResolvedValue(true),
      };

      mockRequest.body = {
        email: "test@example.com",
        password: "password123",
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce("accessToken123")
        .mockReturnValueOnce("refreshToken123");

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashedPassword123",
      );
      expect(mockUser.save).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(sendMock).toHaveBeenCalledWith({
        accessToken: "accessToken123",
        refreshToken: "refreshToken123",
        _id: mockUser._id,
      });
    });

    it("should return 400 if email is missing", async () => {
      mockRequest.body = {
        password: "password123",
      };

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(sendMock).toHaveBeenCalledWith({
        message: "missing email or password",
      });
    });

    it("should return 400 if password is missing", async () => {
      mockRequest.body = {
        email: "test@example.com",
      };

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(sendMock).toHaveBeenCalledWith({
        message: "missing email or password",
      });
    });

    it("should return 401 if user not found", async () => {
      mockRequest.body = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(sendMock).toHaveBeenCalledWith({
        message: "email or password incorrect",
      });
    });

    it("should return 401 if password is incorrect", async () => {
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
        password: "hashedPassword123",
        refreshTokens: [],
      };

      mockRequest.body = {
        email: "test@example.com",
        password: "wrongPassword",
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "wrongPassword",
        "hashedPassword123",
      );
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(sendMock).toHaveBeenCalledWith({
        message: "email or password incorrect",
      });
    });

    it("should return 500 if token generation fails", async () => {
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
        password: "hashedPassword123",
        refreshTokens: [],
      };

      mockRequest.body = {
        email: "test@example.com",
        password: "password123",
      };

      process.env.TOKEN_SECRET = "";

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(sendMock).toHaveBeenCalledWith({
        message: "internal server error",
      });
    });

    it("should handle database errors during login", async () => {
      mockRequest.body = {
        email: "test@example.com",
        password: "password123",
      };

      const error = new Error("Database error");
      (User.findOne as jest.Mock).mockRejectedValue(error);

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(sendMock).toHaveBeenCalledWith(error);
    });
  });

  describe("refresh", () => {
    it("should refresh tokens successfully", async () => {
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
        refreshTokens: ["oldRefreshToken"],
        save: jest.fn().mockResolvedValue(true),
      };

      mockRequest.body = {
        refreshToken: "oldRefreshToken",
      };

      (jwt.verify as jest.Mock).mockImplementation(
        (token, secret, callback) => {
          callback(null, { _id: "507f1f77bcf86cd799439011" });
        },
      );
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce("newAccessToken")
        .mockReturnValueOnce("newRefreshToken");

      await authController.refresh(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(jwt.verify).toHaveBeenCalled();
      expect(User.findById).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
      expect(mockUser.save).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(sendMock).toHaveBeenCalledWith({
        accessToken: "newAccessToken",
        refreshToken: "newRefreshToken",
        _id: mockUser._id,
      });
    });

    it("should return 400 if refresh token is invalid", async () => {
      mockRequest.body = {
        refreshToken: "invalidToken",
      };

      (jwt.verify as jest.Mock).mockImplementation(
        (token, secret, callback) => {
          callback(new Error("Invalid token"), null);
        },
      );

      await authController.refresh(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(sendMock).toHaveBeenCalledWith({ message: "fail" });
    });

    it("should return 400 if refresh token is missing", async () => {
      mockRequest.body = {};

      await authController.refresh(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(sendMock).toHaveBeenCalledWith({ message: "fail" });
    });

    it("should return 400 if user not found", async () => {
      mockRequest.body = {
        refreshToken: "validToken",
      };

      (jwt.verify as jest.Mock).mockImplementation(
        (token, secret, callback) => {
          callback(null, { _id: "507f1f77bcf86cd799439011" });
        },
      );
      (User.findById as jest.Mock).mockResolvedValue(null);

      await authController.refresh(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(sendMock).toHaveBeenCalledWith({ message: "fail" });
    });

    it("should invalidate all tokens if refresh token not in user's list", async () => {
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
        refreshTokens: ["differentToken"],
        save: jest.fn().mockResolvedValue(true),
      };

      mockRequest.body = {
        refreshToken: "notInList",
      };

      (jwt.verify as jest.Mock).mockImplementation(
        (token, secret, callback) => {
          callback(null, { _id: "507f1f77bcf86cd799439011" });
        },
      );
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await authController.refresh(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockUser.refreshTokens).toEqual([]);
      expect(mockUser.save).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(sendMock).toHaveBeenCalledWith({ message: "fail" });
    });

    it("should return 500 if token generation fails during refresh", async () => {
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
        refreshTokens: ["validToken"],
        save: jest.fn().mockResolvedValue(true),
      };

      mockRequest.body = {
        refreshToken: "validToken",
      };

      // Set TOKEN_SECRET so verifyRefreshToken succeeds
      process.env.TOKEN_SECRET = "test-secret";
      // But then clear it after jwt.verify is called to make generateToken fail
      (jwt.verify as jest.Mock).mockImplementation(
        (token, secret, callback) => {
          callback(null, { _id: "507f1f77bcf86cd799439011" });
          // Clear TOKEN_SECRET after verify succeeds
          process.env.TOKEN_SECRET = "";
        },
      );
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await authController.refresh(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(sendMock).toHaveBeenCalledWith({
        message: "internal server error",
      });
      
      // Restore TOKEN_SECRET for other tests
      process.env.TOKEN_SECRET = "test-secret";
    });
  });

  describe("logout", () => {
    it("should logout successfully", async () => {
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
        refreshTokens: ["validToken", "anotherToken"],
        save: jest.fn().mockResolvedValue(true),
      };

      mockRequest.body = {
        refreshToken: "validToken",
      };

      (jwt.verify as jest.Mock).mockImplementation(
        (token, secret, callback) => {
          callback(null, { _id: "507f1f77bcf86cd799439011" });
        },
      );
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await authController.logout(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(jwt.verify).toHaveBeenCalled();
      expect(User.findById).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
      expect(mockUser.refreshTokens).toEqual(["anotherToken"]);
      expect(mockUser.save).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(sendMock).toHaveBeenCalledWith({ message: "logout success" });
    });

    it("should return 400 if logout fails", async () => {
      mockRequest.body = {
        refreshToken: "invalidToken",
      };

      (jwt.verify as jest.Mock).mockImplementation(
        (token, secret, callback) => {
          callback(new Error("Invalid token"), null);
        },
      );

      await authController.logout(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(sendMock).toHaveBeenCalledWith({ message: "failed to Logout" });
    });

    it("should return 400 if refresh token is missing during logout", async () => {
      mockRequest.body = {};

      await authController.logout(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(sendMock).toHaveBeenCalledWith({ message: "failed to Logout" });
    });
  });
});
