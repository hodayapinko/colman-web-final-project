import { Request, Response, NextFunction } from "express";
import { TokenService } from "../services/tokenService";
import { HTTP_STATUS } from "../constants/constants";
import { TokenExpiredError } from "jsonwebtoken";

interface AuthRequest extends Request {
  userId?: string;
}

const getUnauthorizedResponse = (res: Response, message: string) => {
  return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message });
};

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
       getUnauthorizedResponse(res, "Access denied. No token provided.");
       return;
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
       getUnauthorizedResponse(res, "Access denied. Invalid token format.");
        return;
    }

    const token = parts[1];

    const payload = TokenService.verifyAccessToken(token);
    req.userId = TokenService.extractUserIdFromToken(payload);

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    if (error instanceof TokenExpiredError) {
       getUnauthorizedResponse(res, "Token expired.");
       return
    }

     getUnauthorizedResponse(res, "Invalid token.");
  }
}