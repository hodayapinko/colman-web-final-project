import { Request, Response } from "express";
import {
  createComment,
  getAllComments,
  getCommentById,
  getCommentsByPostId,
  updateComment,
  deleteComment,
} from "../comment.controller";
import Comment from "../../models/Comment.model";
import { HTTP_STATUS } from "../../constants/constants";
import { findPostById, findUserById } from "../shared/functions";

jest.mock("../../models/Comment.model");
jest.mock("../shared/functions");

describe("Comment Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = { status: statusMock };
    mockRequest = {};
  });

  describe("createComment", () => {
    it("should create a comment successfully", async () => {
      const mockCommentData = {
        postId: "507f1f77bcf86cd799439011",
        content: "Great post!",
        userId: "507f1f77bcf86cd799439012",
      };
      const savedComment = { _id: "123", ...mockCommentData };

      mockRequest.body = mockCommentData;
      (findPostById as jest.Mock).mockResolvedValue({
        _id: mockCommentData.postId,
      });
      (findUserById as jest.Mock).mockResolvedValue({
        _id: mockCommentData.userId,
      });
      const saveMock = jest.fn().mockResolvedValue(savedComment);
      (Comment as unknown as jest.Mock).mockImplementation(() => ({
        save: saveMock,
      }));

      await createComment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Comment created successfully",
        data: savedComment,
      });
    });

    it("should return 400 if required fields are missing", async () => {
      mockRequest.body = { content: "Test" };

      await createComment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message:
          "Missing required fields: postId, content, userId are required",
      });
    });

    it("should return 400 if postId is invalid", async () => {
      mockRequest.body = {
        postId: "invalid-id",
        content: "Test",
        userId: "507f1f77bcf86cd799439012",
      };

      await createComment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Invalid postId",
      });
    });

    it("should return 400 if sender is invalid", async () => {
      mockRequest.body = {
        postId: "507f1f77bcf86cd799439011",
        content: "Test",
        userId: "invalid-user-id",
      };

      await createComment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Invalid userId",
      });
    });

    it("should return 404 if post not found", async () => {
      mockRequest.body = {
        postId: "507f1f77bcf86cd799439011",
        content: "Test",
        userId: "507f1f77bcf86cd799439012",
      };
      (findPostById as jest.Mock).mockResolvedValue(null);

      await createComment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Post not found",
      });
    });

    it("should handle validation errors", async () => {
      mockRequest.body = {
        postId: "507f1f77bcf86cd799439011",
        content: "Test",
        userId: "507f1f77bcf86cd799439012",
      };
      (findPostById as jest.Mock).mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
      });
      (findUserById as jest.Mock).mockResolvedValue({
        _id: "507f1f77bcf86cd799439012",
      });

      const validationError = {
        name: "ValidationError",
        errors: {
          content: { message: "Content is too short" },
        },
      };
      const saveMock = jest.fn().mockRejectedValue(validationError);
      (Comment as unknown as jest.Mock).mockImplementation(() => ({
        save: saveMock,
      }));

      await createComment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Validation error",
        errors: ["Content is too short"],
      });
    });

    it("should handle internal server errors", async () => {
      mockRequest.body = {
        postId: "507f1f77bcf86cd799439011",
        content: "Test",
        userId: "507f1f77bcf86cd799439012",
      };
      (findPostById as jest.Mock).mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
      });
      (findUserById as jest.Mock).mockResolvedValue({
        _id: "507f1f77bcf86cd799439012",
      });

      const saveMock = jest.fn().mockRejectedValue(new Error("Database error"));
      (Comment as unknown as jest.Mock).mockImplementation(() => ({
        save: saveMock,
      }));

      await createComment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Internal server error",
        error: "Database error",
      });
    });
  });

  describe("getAllComments", () => {
    it("should return all comments successfully", async () => {
      const mockComments = [
        {
          _id: "1",
          postId: "507f1f77bcf86cd799439011",
          content: "Comment 1",
          sender: "507f1f77bcf86cd799439012",
        },
        {
          _id: "2",
          postId: "507f1f77bcf86cd799439013",
          content: "Comment 2",
          sender: "507f1f77bcf86cd799439014",
        },
      ];
      (Comment.find as jest.Mock).mockResolvedValue(mockComments);

      await getAllComments(mockRequest as Request, mockResponse as Response);

      expect(Comment.find).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Comments retrieved successfully",
        data: mockComments,
      });
    });

    it("should return empty array when no comments exist", async () => {
      (Comment.find as jest.Mock).mockResolvedValue([]);

      await getAllComments(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Comments retrieved successfully",
        data: [],
      });
    });

    it("should handle database errors", async () => {
      (Comment.find as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      await getAllComments(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Internal server error",
        error: "Database error",
      });
    });
  });

  describe("getCommentById", () => {
    it("should return comment by id successfully", async () => {
      const mockComment = {
        _id: "123",
        postId: "507f1f77bcf86cd799439011",
        content: "Test comment",
        sender: "507f1f77bcf86cd799439012",
      };
      mockRequest.params = { id: "123" };
      (Comment.findById as jest.Mock).mockResolvedValue(mockComment);

      await getCommentById(mockRequest as Request, mockResponse as Response);

      expect(Comment.findById).toHaveBeenCalledWith("123");
      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Comment retrieved successfully",
        data: mockComment,
      });
    });

    it("should return 404 if comment not found", async () => {
      mockRequest.params = { id: "999" };
      (Comment.findById as jest.Mock).mockResolvedValue(null);

      await getCommentById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Comment not found",
      });
    });

    it("should handle database errors", async () => {
      mockRequest.params = { id: "123" };
      (Comment.findById as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      await getCommentById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Internal server error",
        error: "Database error",
      });
    });
  });

  describe("getCommentsByPostId", () => {
    it("should return comments by postId successfully", async () => {
      const postId = "507f1f77bcf86cd799439011";
      const mockComments = [
        {
          _id: "1",
          postId: postId,
          content: "Comment 1",
          sender: "507f1f77bcf86cd799439012",
        },
        {
          _id: "2",
          postId: postId,
          content: "Comment 2",
          sender: "507f1f77bcf86cd799439013",
        },
      ];
      mockRequest.params = { postId };
      (Comment.find as jest.Mock).mockResolvedValue(mockComments);

      await getCommentsByPostId(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(Comment.find).toHaveBeenCalledWith({ postId });
      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: `Comments for post ${postId} retrieved successfully`,
        data: mockComments,
      });
    });

    it("should return 400 if postId is invalid", async () => {
      mockRequest.params = { postId: "invalid-id" };

      await getCommentsByPostId(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Invalid postId",
      });
    });

    it("should return empty array when no comments exist for post", async () => {
      mockRequest.params = { postId: "507f1f77bcf86cd799439011" };
      (Comment.find as jest.Mock).mockResolvedValue([]);

      await getCommentsByPostId(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message:
          "Comments for post 507f1f77bcf86cd799439011 retrieved successfully",
        data: [],
      });
    });

    it("should handle database errors", async () => {
      mockRequest.params = { postId: "507f1f77bcf86cd799439011" };
      (Comment.find as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      await getCommentsByPostId(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Internal server error",
        error: "Database error",
      });
    });
  });

  describe("updateComment", () => {
    it("should update comment successfully", async () => {
      const commentId = "123";
      const updatedContent = "Updated content";
      const mockComment = {
        _id: commentId,
        postId: "507f1f77bcf86cd799439011",
        content: "Old content",
        sender: "507f1f77bcf86cd799439012",
        save: jest.fn().mockResolvedValue({
          _id: commentId,
          postId: "507f1f77bcf86cd799439011",
          content: updatedContent,
          sender: "507f1f77bcf86cd799439012",
        }),
      };

      mockRequest.params = { id: commentId };
      mockRequest.body = { content: updatedContent };
      (Comment.findById as jest.Mock).mockResolvedValue(mockComment);

      await updateComment(mockRequest as Request, mockResponse as Response);

      expect(Comment.findById).toHaveBeenCalledWith(commentId);
      expect(mockComment.save).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Comment updated successfully",
        data: expect.objectContaining({
          content: updatedContent,
        }),
      });
    });

    it("should return 404 if comment not found", async () => {
      mockRequest.params = { id: "999" };
      mockRequest.body = { content: "Updated content" };
      (Comment.findById as jest.Mock).mockResolvedValue(null);

      await updateComment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Comment not found",
      });
    });

    it("should return 400 if content is missing", async () => {
      const mockComment = {
        _id: "123",
        postId: "507f1f77bcf86cd799439011",
        content: "Old content",
        sender: "507f1f77bcf86cd799439012",
      };

      mockRequest.params = { id: "123" };
      mockRequest.body = {};
      (Comment.findById as jest.Mock).mockResolvedValue(mockComment);

      await updateComment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Missing required fields: content is required",
      });
    });

    it("should handle database errors", async () => {
      mockRequest.params = { id: "123" };
      mockRequest.body = { content: "Updated content" };
      (Comment.findById as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      await updateComment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Internal server error",
        error: "Database error",
      });
    });
  });

  describe("deleteComment", () => {
    it("should delete comment successfully", async () => {
      const commentId = "507f1f77bcf86cd799439011";
      const deletedComment = {
        _id: commentId,
        postId: "507f1f77bcf86cd799439012",
        content: "Test comment",
        sender: "507f1f77bcf86cd799439013",
      };
      mockRequest.params = { id: commentId };
      (Comment.findByIdAndDelete as jest.Mock).mockResolvedValue(
        deletedComment,
      );

      await deleteComment(mockRequest as Request, mockResponse as Response);

      expect(Comment.findByIdAndDelete).toHaveBeenCalledWith(commentId);
      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Comment deleted successfully",
        data: deletedComment,
      });
    });

    it("should return 404 if comment not found", async () => {
      mockRequest.params = { id: "507f1f77bcf86cd799439011" };
      (Comment.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      await deleteComment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Comment not found",
      });
    });

    it("should handle database errors", async () => {
      mockRequest.params = { id: "507f1f77bcf86cd799439011" };
      (Comment.findByIdAndDelete as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      await deleteComment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Internal server error",
        error: "Database error",
      });
    });
  });
});
