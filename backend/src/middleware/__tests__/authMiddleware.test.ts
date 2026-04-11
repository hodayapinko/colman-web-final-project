import { Request, Response, NextFunction } from "express";
import { authMiddleware } from "../authMiddleware";
import { TokenService } from "../../services/tokenService";

jest.mock("../../services/tokenService");

describe("authMiddleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn();
    mockRequest = {
      headers: {},
      params: {},
    };
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = jest.fn();
    process.env.ACCESS_TOKEN_SECRET = "test-access-secret";
    process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";
    jest.clearAllMocks();
  });

  it("should return 401 if no token is provided", () => {
    mockRequest.headers = {};

    authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Access denied. No token provided." });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 401 if authorization header has invalid format", () => {
    mockRequest.headers = { authorization: "InvalidFormat" };

    authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(statusMock).toHaveBeenCalledWith(401);
  });

  it("should return 401 if token verification fails", async () => {
    mockRequest.headers = { authorization: "Bearer invalidtoken" };
    (TokenService.verifyAccessToken as jest.Mock).mockImplementation(() => {
      throw new Error("Invalid token");
    });

    authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should call next and set userId if token is valid", async () => {
    mockRequest.headers = { authorization: "Bearer validtoken" };
    (TokenService.verifyAccessToken as jest.Mock).mockReturnValue({
      _id: "user123",
      tokenType: "access",
    });
    (TokenService.extractUserIdFromToken as jest.Mock).mockReturnValue("user123");

    authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect((mockRequest as any).userId).toBe("user123");
    expect(mockNext).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });
});
