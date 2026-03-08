import { Request, Response, NextFunction } from "express";
import { errorHandler } from "../errorHandler";

describe("errorHandler", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRequest = {};
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = jest.fn();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should return 500 and error message in development mode", () => {
    process.env.NODE_ENV = "development";
    const error = new Error("Test error message");

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Internal Server Error",
      message: "Test error message",
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error:", "Test error message");
    expect(consoleErrorSpy).toHaveBeenCalledWith("Stack:", error.stack);
  });

  it("should return generic message in production mode", () => {
    process.env.NODE_ENV = "production";
    const error = new Error("Sensitive error message");

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Internal Server Error",
      message: "Something went wrong",
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error:", "Sensitive error message");
  });
});
