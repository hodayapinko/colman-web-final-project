import { Request, Response } from "express";
import {
  getUserById,
  updateUser,
} from "../user.controller";
import User from "../../models/User.model";
import { HTTP_STATUS } from "../../constants/constants";

jest.mock("../../models/User.model");

describe("getUserById", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = { status: statusMock };
    mockRequest = { params: {} };
  });

  it("should return user by id successfully", async () => {
    const mockUser = {
      _id: "123",
      username: "testuser",
      email: "test@example.com",
    };
    mockRequest.params = { id: "123" };
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
    await getUserById(mockRequest as Request, mockResponse as Response);
    expect(User.findById).toHaveBeenCalledWith("123");
    expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: "User retrieved successfully",
      data: mockUser,
    });
  });

  it("should return 404 if user not found", async () => {
    mockRequest.params = { id: "999" };
    (User.findById as jest.Mock).mockResolvedValue(null);
    await getUserById(mockRequest as Request, mockResponse as Response);
    expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "User not found",
    });
  });

  it("should handle database errors", async () => {
    mockRequest.params = { id: "123" };
    (User.findById as jest.Mock).mockRejectedValue(new Error("DB error"));
    await getUserById(mockRequest as Request, mockResponse as Response);
    expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  });
});

describe("updateUser", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = { status: statusMock };
    mockRequest = { params: {}, body: {} };
  });

  it("should update user successfully", async () => {
    const updatedData = {
      username: "updateduser",
      email: "updated@example.com",
      age: 30,
    };
    const mockUser = { _id: "123", ...updatedData };
    mockRequest.params = { id: "123" };
    mockRequest.body = updatedData;
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
    (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);
    await updateUser(mockRequest as Request, mockResponse as Response);
    expect(User.findById).toHaveBeenCalledWith("123");
    expect(User.findByIdAndUpdate).toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: "User updated successfully",
      data: mockUser,
    });
  });

  it("should return 404 if user not found", async () => {
    mockRequest.params = { id: "999" };
    mockRequest.body = { username: "test" };
    (User.findById as jest.Mock).mockResolvedValue(null);
    await updateUser(mockRequest as Request, mockResponse as Response);
    expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "User not found",
    });
  });

  it("should handle database errors", async () => {
    mockRequest.params = { id: "123" };
    mockRequest.body = { username: "test" };
    (User.findById as jest.Mock).mockRejectedValue(new Error("DB error"));
    await updateUser(mockRequest as Request, mockResponse as Response);
    expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  });

  it("should handle validation errors during update", async () => {
    const mockUser = { _id: "123" };
    mockRequest.params = { id: "123" };
    mockRequest.body = { email: "invalid-email" };
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
    const validationError = {
      name: "ValidationError",
      message: "Invalid email format",
    };
    (User.findByIdAndUpdate as jest.Mock).mockRejectedValue(validationError);
    await updateUser(mockRequest as Request, mockResponse as Response);
    expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Validation error",
      error: "Invalid email format",
    });
  });

  it("should handle duplicate key errors during update", async () => {
    const mockUser = { _id: "123" };
    mockRequest.params = { id: "123" };
    mockRequest.body = { username: "existinguser" };
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
    const duplicateError = {
      code: 11000,
      keyPattern: { username: 1 },
    };
    (User.findByIdAndUpdate as jest.Mock).mockRejectedValue(duplicateError);
    await updateUser(mockRequest as Request, mockResponse as Response);
    expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.CONFLICT);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Username already exists",
    });
  });
});


