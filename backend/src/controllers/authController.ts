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
  static async register(req: Request, res: Response): Promise<void> {
    try {
      let { username, email, password } = req.body;
      username = username?.trim();
      email = email?.trim().toLowerCase();

      if (!username || !email || !password) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'username, email, and password are required' });
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username) || username.length < 3 || username.length > 30) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Username can only contain letters, numbers, and underscores' });
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Please provide a valid email address' });
        return;
      }

      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        res.status(HTTP_STATUS.CONFLICT).json({ message: 'Username already taken' });
        return;
      }
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        res.status(HTTP_STATUS.CONFLICT).json({ message: 'Email already registered' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ username, email, password: hashedPassword, refreshTokens: [] });

      const tokens = TokenService.generateTokenPair(user._id.toString());
      if (!tokens) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        return;
      }
      user.refreshTokens = [tokens.refreshToken];
      await user.save();
      setRefreshCookie(res, tokens.refreshToken);

      res.status(HTTP_STATUS.CREATED).json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, _id: user._id });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      let { email, username, password } = req.body;
      username = username?.trim();
      email = email?.trim().toLowerCase();

      if ((!email && !username) || !password) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'missing username/email or password' });
        return;
      }
      const user = await User.findOne(email ? { email } : { username });
      if (!user || !user.password) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Invalid credentials' });
        return;
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Invalid credentials' });
        return;
      }

      const tokens = TokenService.generateTokenPair(user._id.toString());
      if (!tokens) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Failed to generate tokens' });
        return;
      }
      user.refreshTokens = user.refreshTokens || [];
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();
      setRefreshCookie(res, tokens.refreshToken);

      res.status(HTTP_STATUS.OK).json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, _id: user._id });
    } catch (error) {
      console.error('Login error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  static async googleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { credential } = req.body;
      if (!credential) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'missing credential' });
        return;
      }

      const googleUser = await OAuthService.verifyGoogleToken(credential);
      const normalizedEmail = googleUser.email.toLowerCase();
      let user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        const username = await OAuthService.generateUniqueUsername(googleUser.email, googleUser.name);
        user = await User.create({ username, email: normalizedEmail, profilePicture: googleUser.picture, refreshTokens: [] });
      }

      const tokens = TokenService.generateTokenPair(user._id.toString());
      if (!tokens) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Failed to generate tokens' });
        return;
      }
      user.refreshTokens = user.refreshTokens || [];
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();
      setRefreshCookie(res, tokens.refreshToken);

      res.status(HTTP_STATUS.OK).json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, _id: user._id });
    } catch (error) {
      console.error('Google login error:', error);
      if (error instanceof Error && error.message === 'Invalid Google token') {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Invalid Google token' });
        return;
      }
      if (error instanceof Error && error.message === 'GOOGLE_CLIENT_ID is not defined') {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'GOOGLE_CLIENT_ID is not defined' });
        return;
      }
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = getRefreshTokenFromRequest(req);
      if (!refreshToken) {
        res.status(HTTP_STATUS.FORBIDDEN).json({ message: 'Forbidden' });
        return;
      }

      let payload;
      try {
        payload = await TokenService.verifyToken(refreshToken);
        TokenService.assertTokenType(payload, 'refresh');
      } catch {
        res.status(HTTP_STATUS.FORBIDDEN).json({ message: 'Forbidden' });
        return;
      }

      const userId = TokenService.extractUserId(payload);
      const user = await User.findById(userId);
      if (!user) {
        res.status(HTTP_STATUS.FORBIDDEN).json({ message: 'Forbidden' });
        return;
      }

      if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
        user.refreshTokens = [];
        await user.save();
        res.status(HTTP_STATUS.FORBIDDEN).json({ message: 'Forbidden' });
        return;
      }

      user.refreshTokens = user.refreshTokens.filter((token: string) => token !== refreshToken);
      const tokens = TokenService.generateTokenPair(user._id.toString());
      if (!tokens) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Failed to generate tokens' });
        return;
      }
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();
      setRefreshCookie(res, tokens.refreshToken);

      res.status(HTTP_STATUS.OK).json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, _id: user._id });
    } catch (error) {
      console.error('Refresh error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

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
          user.refreshTokens = user.refreshTokens.filter((token: string) => token !== refreshToken);
          await user.save();
        }
      } catch {
        // even if token is expired/invalid, still clear cookie and return success
      }
      clearRefreshCookie(res);
      res.status(HTTP_STATUS.OK).json({ message: 'logout success' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }

  static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Unauthorized' });
        return;
      }
      const user = await User.findById(userId).select('-password -refreshTokens');
      if (!user) {
        res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'User not found' });
        return;
      }
      res.status(HTTP_STATUS.OK).json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
    }
  }
}
