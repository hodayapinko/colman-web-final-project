import { Request, Response, NextFunction } from "express";
import { authMiddleware } from "../authMiddleware";
import jwt from "jsonwebtoken";

jest.mock("jsonwebtoken");

describe("authMiddleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;

  beforeEach(() => {
    statusMock = jest.fn().mockReturnThis();
    sendMock = jest.fn();
    mockRequest = {
      header: jest.fn(),
      params: {},
    };
    mockResponse = {
      status: statusMock,
      send: sendMock,
    };
    mockNext = jest.fn();
    process.env.TOKEN_SECRET = "test-secret";
    jest.clearAllMocks();
  });

  it("should return 401 if no token is provided", () => {
    (mockRequest.header as jest.Mock).mockReturnValue(undefined);

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 401 if authorization header is missing token", () => {
    (mockRequest.header as jest.Mock).mockReturnValue("Bearer ");

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 500 if TOKEN_SECRET is not defined", () => {
    delete process.env.TOKEN_SECRET;
    (mockRequest.header as jest.Mock).mockReturnValue("Bearer validtoken");

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(sendMock).toHaveBeenCalledWith("Internal Server Error");
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 401 if token verification fails", () => {
    (mockRequest.header as jest.Mock).mockReturnValue("Bearer invalidtoken");
    (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      callback(new Error("Invalid token"), null);
    });

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(sendMock).toHaveBeenCalledWith("Unauthorized");
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should call next and set userId in params if token is valid", () => {
    (mockRequest.header as jest.Mock).mockReturnValue("Bearer validtoken");
    (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      callback(null, { _id: "user123" });
    });

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.params?.userId).toBe("user123");
    expect(mockNext).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });
});
