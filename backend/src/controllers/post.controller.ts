import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import Post from "../models/Post.model";
import { HTTP_STATUS } from "../constants/constants";
import mongoose from "mongoose";
import { findUserById } from "./shared/functions";

export const getAllPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const posts = await Post.find()
      .populate("user", "username profilePicture")
      .sort({ createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Posts retrieved successfully",
      data: posts,
    });
  } catch (error: any) {
    console.error("Error retrieving posts:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getPostsByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    // userId is guaranteed to exist because the router checks for it before calling this function
    const { userId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId as string)) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid user ID",
      });
      return;
    }

    const posts = await Post.find({ user: userId });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Posts by user ${userId} retrieved successfully`,
      data: posts,
    });
  } catch (error: any) {
    console.error("Error retrieving posts by user:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getPostById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);

    if (!post) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Post not found",
      });
      return;
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Post retrieved successfully",
      data: post,
    });
  } catch (error: any) {
    console.error("Error retrieving post:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const createPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, userId, image, location, rating } = req.body as {
      title: string;
      content: string;
      userId: string;
      image?: string;
      location?: string;
      rating?: number;
    };

    if (!title || !content || !userId) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Missing required fields: title, content, and userId are required",
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

    // Ensure user exists
    const userExists = await findUserById(userId);
    if (!userExists) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const newPost = new Post({
      title,
      content,
      image,
      location,
      rating,
      user: userId,
    });

    const savedPost = await newPost.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Post created successfully",
      data: savedPost,
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

    console.error("Error creating post:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updatePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, userId, image, location, rating } = req.body as Partial<{
      title: string;
      content: string;
      userId: string;
      image: string;
      location: string;
      rating: number;
    }>;

    // Build update object with only provided fields
    const updateData: Partial<{ 
      title: string; 
      content: string; 
      user: string;
      image: string;
      location: string;
      rating: number;
    }> = {};
    
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (image !== undefined && image !== "") updateData.image = image;
    if (location !== undefined) updateData.location = location;
    if (rating !== undefined) updateData.rating = rating;
    if (userId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Invalid userId",
        });
        return;
      }
      
      // Ensure user exists
      const userExists = await findUserById(userId);
      if (!userExists) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "User not found",
        });
        return;
      }
      updateData.user = userId;
    }

    // Check if there's at least one field to update
    if (Object.keys(updateData).length === 0 && image !== "") {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "At least one field must be provided for update",
      });
      return;
    }

    // If image is being changed or removed, delete the old file from disk
    const imageIsChanging = image !== undefined && (image === "" || (image !== "" && updateData.image !== undefined));
    if (imageIsChanging) {
      const existingPost = await Post.findById(id).select("image");
      if (existingPost?.image) {
        // Image URLs look like http://host:port/public/filename.ext — extract the relative path
        const oldRelative = existingPost.image.replace(/^https?:\/\/[^/]+\//, "");
        const oldAbsolute = path.join(process.cwd(), oldRelative);
        if (fs.existsSync(oldAbsolute)) {
          fs.unlinkSync(oldAbsolute);
        }
      }
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      {
        ...(Object.keys(updateData).length > 0 && { $set: updateData }),
        ...(image === "" && { $unset: { image: 1 } }),
      },
      { new: true, runValidators: true }
    );

    if (!updatedPost) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Post not found",
      });
      return;
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Post updated successfully",
      data: updatedPost,
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

    console.error("Error updating post:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const deletePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const deletedPost = await Post.findByIdAndDelete(id);

    if (!deletedPost) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Post not found",
      });
      return;
    }

    // Delete the image file from disk if it exists
    if (deletedPost.image) {
      const oldRelative = deletedPost.image.replace(/^https?:\/\/[^/]+\//, "");
      const oldAbsolute = path.join(process.cwd(), oldRelative);
      if (fs.existsSync(oldAbsolute)) {
        fs.unlinkSync(oldAbsolute);
      }
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Post deleted successfully",
      data: deletedPost,
    });
  } catch (error: any) {
    console.error("Error deleting post:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
