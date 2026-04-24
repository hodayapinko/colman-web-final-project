import { Request, Response } from "express";
import User from "../models/User.model";
import { HTTP_STATUS, IUser } from "../constants/constants";
import { findUserById } from "./shared/functions";

export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await findUserById(id);

    if (!user) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error: any) {
    console.error("Error retrieving user:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { username, email, password, age, profilePicture } =
      req.body as Partial<IUser>;

    const user = await User.findById(id);

    if (!user) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { username, email, password, age, profilePicture },
      { new: true, runValidators: true }
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error: any) {
    console.error("Error updating user:", error);

    if (error.name === "ValidationError") {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        error: error.message,
      });
      return;
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
      });
      return;
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


