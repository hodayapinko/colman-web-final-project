import { Request, Response } from "express";
import {
  getAllPosts,
  getPostsByUserId,
  getPostById,
  createPost,
  updatePost,
} from "../post.controller";
import Post from "../../models/Post.model";
import { HTTP_STATUS } from "../../constants/constants";
import { findUserById } from "../shared/functions";

// Mock the Post model
jest.mock("../../models/Post.model");
jest.mock("../shared/functions");

describe("Post Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRequest = {};
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    jest.clearAllMocks();
  });

  describe("getAllPosts", () => {
    it("should return all posts successfully", async () => {
      const mockPosts = [
        {
          _id: "507f1f77bcf86cd799439011",
          title: "Test Post 1",
          content: "Test content 1",
          user: "507f1f77bcf86cd799439012",
        },
        {
          _id: "507f1f77bcf86cd799439013",
          title: "Test Post 2",
          content: "Test content 2",
          user: "507f1f77bcf86cd799439014",
        },
      ];

      (Post.find as jest.Mock).mockResolvedValue(mockPosts);

      await getAllPosts(mockRequest as Request, mockResponse as Response);

      expect(Post.find).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Posts retrieved successfully",
        data: mockPosts,
      });
    });

    it("should handle database errors", async () => {
      (Post.find as jest.Mock).mockRejectedValue(new Error("DB error"));

      await getAllPosts(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Internal server error",
        error: "DB error",
      });
    });
  });

  describe("getPostsByUserId", () => {
    it("should return posts by userId successfully", async () => {
      const mockPosts = [
        {
          _id: "507f1f77bcf86cd799439011",
          title: "Test Post",
          content: "Test content",
          user: "507f1f77bcf86cd799439012",
        },
      ];

      mockRequest.query = { userId: "507f1f77bcf86cd799439012" };
      (Post.find as jest.Mock).mockResolvedValue(mockPosts);

      await getPostsByUserId(mockRequest as Request, mockResponse as Response);

      expect(Post.find).toHaveBeenCalledWith({
        user: "507f1f77bcf86cd799439012",
      });
      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Posts by user 507f1f77bcf86cd799439012 retrieved successfully",
        data: mockPosts,
      });
    });

    it("should return 400 if userId is invalid", async () => {
      mockRequest.query = { userId: "invalid-id" };

      await getPostsByUserId(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Invalid user ID",
      });
    });

    it("should handle database errors", async () => {
      mockRequest.query = { userId: "507f1f77bcf86cd799439012" };
      (Post.find as jest.Mock).mockRejectedValue(new Error("DB error"));

      await getPostsByUserId(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Internal server error",
        error: "DB error",
      });
    });
  });

  describe("getPostById", () => {
    it("should return post by id successfully", async () => {
      const mockPost = {
        _id: "507f1f77bcf86cd799439011",
        title: "Test Post",
        content: "Test content",
        user: "507f1f77bcf86cd799439012",
      };

      mockRequest.params = { id: "507f1f77bcf86cd799439011" };
      (Post.findById as jest.Mock).mockResolvedValue(mockPost);

      await getPostById(mockRequest as Request, mockResponse as Response);

      expect(Post.findById).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Post retrieved successfully",
        data: mockPost,
      });
    });

    it("should return 404 if post not found", async () => {
      mockRequest.params = { id: "507f1f77bcf86cd799439011" };
      (Post.findById as jest.Mock).mockResolvedValue(null);

      await getPostById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Post not found",
      });
    });

    it("should handle database errors", async () => {
      mockRequest.params = { id: "507f1f77bcf86cd799439011" };
      (Post.findById as jest.Mock).mockRejectedValue(new Error("DB error"));

      await getPostById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Internal server error",
        error: "DB error",
      });
    });
  });

  describe("createPost", () => {
    it("should create a post successfully", async () => {
      const mockPostData = {
        title: "Test Post",
        content: "This is test content with enough characters",
        userId: "507f1f77bcf86cd799439012",
      };

      const mockSavedPost = {
        _id: "507f1f77bcf86cd799439011",
        title: mockPostData.title,
        content: mockPostData.content,
        user: mockPostData.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.body = mockPostData;
      (findUserById as jest.Mock).mockResolvedValue({ _id: mockPostData.userId });
      (Post as any).mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(mockSavedPost),
      }));

      await createPost(mockRequest as Request, mockResponse as Response);

      expect(findUserById).toHaveBeenCalledWith(mockPostData.userId);
      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Post created successfully",
        data: mockSavedPost,
      });
    });

    it("should return 400 if required fields are missing", async () => {
      mockRequest.body = {
        title: "Test Post",
        // Missing content and userId
      };

      await createPost(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Missing required fields: title, content, and userId are required",
      });
    });

    it("should return 404 if user not found", async () => {
      mockRequest.body = {
        title: "Test Post",
        content: "Test content with enough characters",
        userId: "507f1f77bcf86cd799439012",
      };

      (findUserById as jest.Mock).mockResolvedValue(null);

      await createPost(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "User not found",
      });
    });

    it("should return 400 if userId is invalid", async () => {
      mockRequest.body = {
        title: "Test Post",
        content: "Test content",
        userId: "invalid-id",
      };

      await createPost(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Invalid userId",
      });
    });

    it("should handle validation errors", async () => {
      mockRequest.body = {
        title: "Test",
        content: "Test content",
        userId: "507f1f77bcf86cd799439012",
      };

      (findUserById as jest.Mock).mockResolvedValue({ _id: "507f1f77bcf86cd799439012" });

      const validationError = {
        name: "ValidationError",
        errors: {
          title: { message: "Title is too short" },
        },
      };

      (Post as any).mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(validationError),
      }));

      await createPost(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Validation error",
        errors: ["Title is too short"],
      });
    });

    it("should handle database errors", async () => {
      mockRequest.body = {
        title: "Test Post",
        content: "Test content",
        userId: "507f1f77bcf86cd799439012",
      };

      (findUserById as jest.Mock).mockResolvedValue({ _id: "507f1f77bcf86cd799439012" });
      (Post as any).mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error("DB error")),
      }));

      await createPost(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Internal server error",
        error: "DB error",
      });
    });
  });

  describe("updatePost", () => {
    it("should update post successfully", async () => {
      const mockUpdatedPost = {
        _id: "507f1f77bcf86cd799439011",
        title: "Updated Title",
        content: "Updated content",
        user: "507f1f77bcf86cd799439012",
      };

      mockRequest.params = { id: "507f1f77bcf86cd799439011" };
      mockRequest.body = {
        title: "Updated Title",
        content: "Updated content",
      };

      (Post.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUpdatedPost);

      await updatePost(mockRequest as Request, mockResponse as Response);

      expect(Post.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        { title: "Updated Title", content: "Updated content" },
        { new: true, runValidators: true }
      );
      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Post updated successfully",
        data: mockUpdatedPost,
      });
    });

    it("should return 404 if post not found", async () => {
      mockRequest.params = { id: "507f1f77bcf86cd799439011" };
      mockRequest.body = { title: "Updated Title" };

      (Post.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await updatePost(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Post not found",
      });
    });

    it("should return 400 if no fields provided for update", async () => {
      mockRequest.params = { id: "507f1f77bcf86cd799439011" };
      mockRequest.body = {};

      await updatePost(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message:
          "At least one field (title, content, or userId) must be provided for update",
      });
    });

    it("should update post with userId successfully", async () => {
      const mockUpdatedPost = {
        _id: "507f1f77bcf86cd799439011",
        title: "Test Post",
        content: "Test content",
        user: "507f1f77bcf86cd799439015",
      };

      mockRequest.params = { id: "507f1f77bcf86cd799439011" };
      mockRequest.body = { userId: "507f1f77bcf86cd799439015" };

      (findUserById as jest.Mock).mockResolvedValue({ _id: "507f1f77bcf86cd799439015" });
      (Post.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUpdatedPost);

      await updatePost(mockRequest as Request, mockResponse as Response);

      expect(findUserById).toHaveBeenCalledWith("507f1f77bcf86cd799439015");
      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    it("should return 400 if userId is invalid during update", async () => {
      mockRequest.params = { id: "507f1f77bcf86cd799439011" };
      mockRequest.body = { userId: "invalid-id" };

      await updatePost(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Invalid userId",
      });
    });

    it("should return 404 if user not found during update", async () => {
      mockRequest.params = { id: "507f1f77bcf86cd799439011" };
      mockRequest.body = { userId: "507f1f77bcf86cd799439015" };

      (findUserById as jest.Mock).mockResolvedValue(null);

      await updatePost(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "User not found",
      });
    });

    it("should handle validation errors during update", async () => {
      mockRequest.params = { id: "507f1f77bcf86cd799439011" };
      mockRequest.body = { title: "T" };

      const validationError = {
        name: "ValidationError",
        errors: {
          title: { message: "Title too short" },
        },
      };

      (Post.findByIdAndUpdate as jest.Mock).mockRejectedValue(validationError);

      await updatePost(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Validation error",
        errors: ["Title too short"],
      });
    });

    it("should handle database errors during update", async () => {
      mockRequest.params = { id: "507f1f77bcf86cd799439011" };
      mockRequest.body = { title: "Updated Title" };

      (Post.findByIdAndUpdate as jest.Mock).mockRejectedValue(new Error("DB error"));

      await updatePost(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Internal server error",
        error: "DB error",
      });
    });
  });
});
