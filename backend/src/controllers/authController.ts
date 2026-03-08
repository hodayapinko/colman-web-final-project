import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.model';
import { TokenService } from '../services/tokenService';
import { OAuthService } from '../services/oauthService';
import {
  getRefreshTokenFromRequest,
  setRefreshCookie,
  clearRefreshCookie,
} from '../utils/cookieUtils';
import { HTTP_STATUS } from '../constants/constants';

type AuthenticatedRequest = Request & {
  userId?: string;
};

export class AuthController {
  /**
   * Registers a new user with credentials
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      let { username, email, password } = req.body;

      username = username?.trim();
      email = email?.trim().toLowerCase();

      if (!username || !email || !password) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ message: 'missing username, email or password' });
        return;
      }

      if (password.length < 8) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ message: 'Password must be at least 8 characters' });
        return;
      }

      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        res
          .status(HTTP_STATUS.CONFLICT)
          .json({ message: 'username already exists' });
        return;
      }

      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        res
          .status(HTTP_STATUS.CONFLICT)
          .json({ message: 'email already exists' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        refreshTokens: [],
      });

      res.status(HTTP_STATUS.CREATED).json({
        _id: user._id,
        username: user.username,
        email: user.email,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  /**
   * Authenticates user with credentials
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      let { email, username, password } = req.body;

  

      if ((!email && !username) || !password) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ message: 'missing username/email or password' });
        return;
      }

      const user = await User.findOne(email ? { email } : { username });

      if (!user || !user.password) {
        res
          .status(HTTP_STATUS.UNAUTHORIZED)
          .json({ message: 'email/username or password incorrect' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res
          .status(HTTP_STATUS.UNAUTHORIZED)
          .json({ message: 'email/username or password incorrect' });
        return;
      }

      const tokens = TokenService.generateTokenPair(user._id.toString());
      if (!tokens) {
        res
          .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
          .json({ message: 'Failed to generate tokens' });
        return;
      }

      user.refreshTokens = user.refreshTokens || [];
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();

      setRefreshCookie(res, tokens.refreshToken);

      res.status(HTTP_STATUS.OK).json({
        accessToken: tokens.accessToken,
        _id: user._id,
        username: user.username,
        email: user.email,
      });
    } catch (error) {
      console.error('Login error:', error);
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  /**
   * Authenticates user with Google OAuth
   * POST /api/auth/google
   */
  static async googleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ message: 'missing idToken' });
        return;
      }

      const googleUser = await OAuthService.verifyGoogleToken(idToken);

      let user = await User.findOne({ email: googleUser.email.toLowerCase() });

      if (!user) {
        const username = await OAuthService.generateUniqueUsername(
          googleUser.email,
          googleUser.name,
        );

        user = await User.create({
          username: username,
          email: googleUser.email,
          profilePicture: googleUser.picture,
          refreshTokens: [],
        });
      }

      const tokens = TokenService.generateTokenPair(user._id.toString());
      if (!tokens) {
        res
          .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
          .json({ message: 'Failed to generate tokens' });
        return;
      }

      user.refreshTokens = user.refreshTokens || [];
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();

      setRefreshCookie(res, tokens.refreshToken);

      res.status(HTTP_STATUS.OK).json({
        accessToken: tokens.accessToken,
        _id: user._id,
        username: user.username,
        email: user.email,
      });
    } catch (error) {
      console.error('Google login error:', error);

      if (
        error instanceof Error &&
        error.message === 'Invalid Google token'
      ) {
        res
          .status(HTTP_STATUS.UNAUTHORIZED)
          .json({ message: 'invalid Google token' });
        return;
      }

      if (
        error instanceof Error &&
        error.message === 'GOOGLE_CLIENT_ID is not defined'
      ) {
        res
          .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
          .json({ message: 'GOOGLE_CLIENT_ID is not defined' });
        return;
      }

      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  /**
   * Refreshes access token using refresh token
   * POST /api/auth/refresh
   */
  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = getRefreshTokenFromRequest(req);

      if (!refreshToken) {
        res
          .status(HTTP_STATUS.UNAUTHORIZED)
          .json({ message: 'Unauthorized' });
        return;
      }

      let payload;
      try {
        payload = await TokenService.verifyToken(refreshToken);
        TokenService.assertTokenType(payload, 'refresh');
      } catch {
        res
          .status(HTTP_STATUS.UNAUTHORIZED)
          .json({ message: 'invalid or expired refresh token' });
        return;
      }

      const userId = TokenService.extractUserId(payload);
      const user = await User.findById(userId);

      if (!user) {
        res
          .status(HTTP_STATUS.UNAUTHORIZED)
          .json({ message: 'Unauthorized' });
        return;
      }

      if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
        res
          .status(HTTP_STATUS.UNAUTHORIZED)
          .json({ message: 'invalid refresh token' });
        return;
      }

      user.refreshTokens = user.refreshTokens.filter(
        (token: string) => token !== refreshToken,
      );

      const tokens = TokenService.generateTokenPair(user._id.toString());
      if (!tokens) {
        res
          .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
          .json({ message: 'Failed to generate tokens' });
        return;
      }

      user.refreshTokens.push(tokens.refreshToken);
      await user.save();

      setRefreshCookie(res, tokens.refreshToken);

      res.status(HTTP_STATUS.OK).json({
        accessToken: tokens.accessToken,
        _id: user._id,
      });
    } catch (error) {
      console.error('Refresh error:', error);
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  /**
   * Logs out user and invalidates refresh token
   * POST /api/auth/logout
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = getRefreshTokenFromRequest(req);

      if (!refreshToken) {
        clearRefreshCookie(res);
        res.status(HTTP_STATUS.OK).json({ message: 'logout success' });
        return;
      }

      try {
        const payload = await TokenService.verifyToken(refreshToken);
        TokenService.assertTokenType(payload, 'refresh');
        const userId = TokenService.extractUserId(payload);

        const user = await User.findById(userId);
        if (user?.refreshTokens) {
          user.refreshTokens = user.refreshTokens.filter(
            (token: string) => token !== refreshToken,
          );
          await user.save();
        }
      } catch {
        // even if token is expired/invalid, still clear cookie and return success
      }

      clearRefreshCookie(res);
      res.status(HTTP_STATUS.OK).json({ message: 'logout success' });
    } catch (error) {
      console.error('Logout error:', error);
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  /**
   * Returns current authenticated user's information
   * GET /api/auth/me
   */
  static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        res
          .status(HTTP_STATUS.UNAUTHORIZED)
          .json({ message: 'Unauthorized' });
        return;
      }

      const user = await User.findById(userId).select('-password -refreshTokens');

      if (!user) {
        res
          .status(HTTP_STATUS.NOT_FOUND)
          .json({ message: 'User not found' });
        return;
      }

      res.status(HTTP_STATUS.OK).json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }
}