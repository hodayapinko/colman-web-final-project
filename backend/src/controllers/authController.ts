import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.model';
import { TokenService } from '../services/tokenService';
import { OAuthService } from '../services/oauthService';
import { getRefreshTokenFromRequest, setRefreshCookie, clearRefreshCookie } from '../utils/cookieUtils';

export class AuthController {
  /**
   * Registers a new user with credentials
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password } = req.body;

      // Validate required fields
      if (!username || !email || !password) {
        res.status(400).json({ message: 'missing username, email or password' });
        return;
      }

      // Validate password
      if (!password || password.length < 8) {
        res.status(400).json({ message: 'Password must be at least 8 characters' });
        return;
      }

      // Check if username exists
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        res.status(409).json({ message: 'username already exists' });
        return;
      }

      // Check if email exists
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        res.status(409).json({ message: 'email already exists' });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
        username,
        email,
        password: hashedPassword
      });

      // Return user data (exclude password)
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Authenticates user with credentials
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, username, password } = req.body;

      // Validate required fields
      if ((!email && !username) || !password) {
        res.status(400).json({ message: 'missing username/email or password' });
        return;
      }

      // Find user by email or username
      const user = await User.findOne(
        email ? { email } : { username }
      );

      if (!user || !user.password) {
        res.status(401).json({ message: 'email or password incorrect' });
        return;
      }

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ message: 'email or password incorrect' });
        return;
      }

      // Generate tokens
      const tokens = TokenService.generateTokenPair(user._id.toString());
      if (!tokens) {
        res.status(500).json({ message: 'Failed to generate tokens' });
        return;
      }

      // Add refresh token to user's token array
      user.refreshTokens = user.refreshTokens || [];
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();

      // Set refresh token cookie
      setRefreshCookie(res, tokens.refreshToken);

      // Return tokens and user ID
      res.status(200).json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        _id: user._id
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Authenticates user with Google OAuth
   * POST /api/auth/google
   */
  static async googleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { idToken } = req.body;

      // Validate idToken
      if (!idToken) {
        res.status(400).json({ message: 'missing idToken' });
        return;
      }

      // Verify Google token
      const googleUser = await OAuthService.verifyGoogleToken(idToken);

      // Find or create user
      let user = await User.findOne({ email: googleUser.email });

      if (!user) {
        // Create new user
        const username = await OAuthService.generateUniqueUsername(
          googleUser.email,
          googleUser.name
        );

        user = await User.create({
          username,
          email: googleUser.email,
          profilePicture: googleUser.picture
        });
      }

      // Generate tokens
      const tokens = TokenService.generateTokenPair(user._id.toString());
      if (!tokens) {
        res.status(500).json({ message: 'Failed to generate tokens' });
        return;
      }

      // Add refresh token to user's token array
      user.refreshTokens = user.refreshTokens || [];
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();

      // Set refresh token cookie
      setRefreshCookie(res, tokens.refreshToken);

      // Return tokens and user ID
      res.status(200).json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        _id: user._id
      });
    } catch (error) {
      console.error('Google login error:', error);
      if (error instanceof Error && error.message === 'Invalid Google token') {
        res.status(401).json({ message: 'invalid Google token' });
      } else if (error instanceof Error && error.message === 'GOOGLE_CLIENT_ID is not defined') {
        res.status(500).json({ message: 'GOOGLE_CLIENT_ID is not defined' });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  }

  /**
   * Refreshes access token using refresh token
   * POST /api/auth/refresh
   */
  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      // Extract refresh token from request
      const refreshToken = getRefreshTokenFromRequest(req);

      if (!refreshToken) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      // Verify refresh token
      let payload;
      try {
        payload = await TokenService.verifyToken(refreshToken);
      } catch (error) {
        res.status(401).json({ message: 'invalid or expired refresh token' });
        return;
      }

      // Find user
      const userId = TokenService.extractUserId(payload);
      const user = await User.findById(userId);

      if (!user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      // Check if refresh token exists in user's token array
      if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
        res.status(401).json({ message: 'invalid refresh token' });
        return;
      }

      // Remove old refresh token
      user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);

      // Generate new tokens
      const tokens = TokenService.generateTokenPair(user._id.toString());
      if (!tokens) {
        res.status(500).json({ message: 'Failed to generate tokens' });
        return;
      }

      // Add new refresh token
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();

      // Set new refresh token cookie
      setRefreshCookie(res, tokens.refreshToken);

      // Return new tokens
      res.status(200).json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        _id: user._id
      });
    } catch (error) {
      console.error('Refresh error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Logs out user and invalidates tokens
   * POST /api/auth/logout
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      // Extract refresh token from request
      const refreshToken = getRefreshTokenFromRequest(req);

      if (!refreshToken) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      // Verify refresh token (catch errors gracefully)
      let userId;
      try {
        const payload = await TokenService.verifyToken(refreshToken);
        userId = TokenService.extractUserId(payload);
      } catch (error) {
        // Token invalid/expired, still clear cookie
        clearRefreshCookie(res);
        res.status(200).json({ message: 'logout success' });
        return;
      }

      // Find user and remove refresh token
      const user = await User.findById(userId);
      if (user && user.refreshTokens) {
        user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
        await user.save();
      }

      // Clear refresh token cookie
      clearRefreshCookie(res);

      res.status(200).json({ message: 'logout success' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Returns current authenticated user's information
   * GET /api/auth/me
   */
  static async me(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;

      const user = await User.findById(userId).select('-password -refreshTokens');

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.status(200).json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
