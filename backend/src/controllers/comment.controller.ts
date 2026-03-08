import mongoose from "mongoose";
import { HTTP_STATUS } from "../constants/constants";
import { Request, Response } from "express";
import Comment from "../models/Comment.model";
import { findPostById, findUserById} from "./shared/functions";

export const createComment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { postId, content, userId } = req.body;

    if (!postId || !content || !userId) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message:
          "Missing required fields: postId, content, userId are required",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid postId",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid userId",
      });
      return;
    }

    // ensure post exists
    const postExists = await findPostById(postId);
    if (!postExists) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Post not found",
      });
      return;
    }

    // ensure user exists
   const userExists = await findUserById(userId);

    if (!userExists) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
      return;
   }
    const newComment = new Comment({
      postId,
      content,
      user: userId,
    });

    const savedComment = await newComment.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Comment created successfully",
      data: savedComment,
    });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map((err: any) => err.message),
      });
      return;
    }

    console.error("Error creating comment:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getAllComments = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const comments = await Comment.find();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Comments retrieved successfully",
      data: comments,
    });
  } catch (error: any) {
    console.error("Error retrieving comments:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getCommentById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);

    if (!comment) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Comment not found",
      });
      return;
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Comment retrieved successfully",
      data: comment,
    });
  } catch (error: any) {
    console.error("Error retrieving comment:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getCommentsByPostId = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid postId",
      });
      return;
    }

    const comments = await Comment.find({ postId });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Comments for post ${postId} retrieved successfully`,
      data: comments,
    });
  } catch (error: any) {
    console.error("Error retrieving comments by postId:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateComment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const comment = await Comment.findById(id);

    if (!comment) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Comment not found",
      });
      return;
    }

    if (!content) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Missing required fields: content is required",
      });
      return;
    }

    comment.content = content;

    const updatedComment = await comment.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Comment updated successfully",
      data: updatedComment,
    });
  } catch (error: any) {
    console.error("Error updating comment:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const deleteComment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    const deletedComment = await Comment.findByIdAndDelete(id);

    if (!deletedComment) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Comment not found",
      });
      return;
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Comment deleted successfully",
      data: deletedComment,
    });
  } catch (error: any) {
    console.error("Error deleting comment:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
