import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/tokenService';

/**
 * Middleware to protect routes requiring authentication
 * Validates access token from Authorization header
 * Attaches userId to req.params for downstream use
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Verify token
    try {
      const payload = await TokenService.verifyToken(token);
      const userId = TokenService.extractUserId(payload);

      // Attach user ID to request params
      req.params.userId = userId;

      next();
    } catch (error) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Unauthorized' });
  }
}
