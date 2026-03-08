import { Document } from "mongoose";
import mongoose from "mongoose";

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  refreshTokens?: string[];
  age?: number;
  bio?: string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPost extends Document {
  title: string;
  content: string;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
