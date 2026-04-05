import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.model";
import { TokenService, TokenPair, TokenPayload } from "../services/tokenService";
import { OAuthService, GoogleUserPayload } from "../services/oauthService";
import {
  getRefreshTokenFromRequest,
  setRefreshCookie,
  clearRefreshCookie,
} from "../utils/cookieUtils";
import { HTTP_STATUS, IUser } from "../constants/constants";

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
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ message: "username, email, and password are required" });
        return;
      }
      if (!/^.{3,30}$/.test(username)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: "Username must be between 3 and 30 characters",
        });
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: "Please provide a valid email address",
        });
        return;
      }

      const existingUsername: IUser | null = await User.findOne({ username });
      if (existingUsername) {
        res
          .status(HTTP_STATUS.CONFLICT)
          .json({ message: "Username already taken" });
        return;
      }
      const existingEmail: IUser | null = await User.findOne({ email });
      if (existingEmail) {
        res
          .status(HTTP_STATUS.CONFLICT)
          .json({ message: "Email already registered" });
        return;
      }

      const hashedPassword: string = await bcrypt.hash(password, 10);
      const user: IUser = await User.create({
        username,
        email,
        password: hashedPassword,
        refreshTokens: [],
      });

      const tokens: TokenPair | null = TokenService.generateTokenPair(user._id.toString());
      if (!tokens) {
        res
          .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
          .json({ message: "Internal server error" });
        return;
      }
      user.refreshTokens = [tokens.refreshToken];
      await user.save();
      setRefreshCookie(res, tokens.refreshToken);

      res.status(HTTP_STATUS.CREATED).json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        _id: user._id,
        username: user.username,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server error" });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      let { email, username, password } = req.body;
      username = username?.trim();
      email = email?.trim().toLowerCase();

      if ((!email && !username) || !password) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ message: "missing username/email or password" });
        return;
      }

      const user: IUser | null = await User.findOne(email ? { email } : { username });
      if (!user || !user.password) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ message: "Invalid credentials" });
        return;
      }

      const isMatch: boolean = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ message: "Invalid credentials" });
        return;
      }

      const tokens: TokenPair | null = TokenService.generateTokenPair(user._id.toString());
      if (!tokens) {
        res
          .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
          .json({ message: "Failed to generate tokens" });
        return;
      }

      user.refreshTokens = user.refreshTokens || [];
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();
      setRefreshCookie(res, tokens.refreshToken);

      res.status(HTTP_STATUS.OK).json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        _id: user._id,
        username: user.username,
      });
    } catch (error) {
      console.error("Login error:", error);
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server error" });
    }
  }

  static async googleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { credential }: { credential: string } = req.body;
      if (!credential) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ message: "missing credential" });
        return;
      }

      const googleUser: GoogleUserPayload = await OAuthService.verifyGoogleToken(credential);
      const normalizedEmail: string = googleUser.email.toLowerCase();
      let user: IUser | null = await User.findOne({ email: normalizedEmail });

      if (!user) {
        const username: string = googleUser.name || normalizedEmail.split("@")[0];

        user = await User.create({
          username,
          email: normalizedEmail,
          googleId: googleUser.googleId,
          profilePicture: googleUser.picture || "",
          refreshTokens: [],
        });
      } else {
        if (!user.googleId) {
          user.googleId = googleUser.googleId;
        }
        if (googleUser.picture && user.profilePicture !== googleUser.picture) {
          user.profilePicture = googleUser.picture;
        }
        await user.save();
      }

      const tokens: TokenPair | null = TokenService.generateTokenPair(user._id.toString());
      if (!tokens) {
        res
          .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
          .json({ message: "Failed to generate tokens" });
        return;
      }

      user.refreshTokens = user.refreshTokens || [];
      if (user.refreshTokens.length >= 5) {
        user.refreshTokens = user.refreshTokens.slice(-4);
      }
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();
      setRefreshCookie(res, tokens.refreshToken);

      res.status(HTTP_STATUS.OK).json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
      });
    } catch (error) {
      console.error("Google login error:", error);
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server error" });
    }
  }

  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken: string | undefined = getRefreshTokenFromRequest(req);
      if (!refreshToken) {
        res.status(HTTP_STATUS.FORBIDDEN).json({ message: "Forbidden" });
        return;
      }

      let payload: TokenPayload;
      try {
        payload = await TokenService.verifyRefreshToken(refreshToken);
      } catch {
        res.status(HTTP_STATUS.FORBIDDEN).json({ message: "Forbidden" });
        return;
      }

      const userId: string = TokenService.extractUserIdFromToken(payload);
      const user: IUser | null = await User.findById(userId);
      if (!user) {
        res.status(HTTP_STATUS.FORBIDDEN).json({ message: "Forbidden" });
        return;
      }

      if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
        user.refreshTokens = [];
        await user.save();
        res.status(HTTP_STATUS.FORBIDDEN).json({ message: "Forbidden" });
        return;
      }

      user.refreshTokens = user.refreshTokens.filter(
        (token: string) => token !== refreshToken
      );
      const tokens: TokenPair | null = TokenService.generateTokenPair(user._id.toString());
      if (!tokens) {
        res
          .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
          .json({ message: "Failed to generate tokens" });
        return;
      }
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();
      setRefreshCookie(res, tokens.refreshToken);

      res.status(HTTP_STATUS.OK).json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        _id: user._id,
        username: user.username,
      });
    } catch (error) {
      console.error("Refresh error:", error);
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server error" });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken: string | undefined = getRefreshTokenFromRequest(req);
      if (!refreshToken) {
        clearRefreshCookie(res);
        res.status(HTTP_STATUS.OK).json({ message: "logout success" });
        return;
      }
      try {
        const payload: TokenPayload = await TokenService.verifyRefreshToken(refreshToken);
        const userId: string = TokenService.extractUserIdFromToken(payload);
        const user: IUser | null = await User.findById(userId);
        if (user?.refreshTokens) {
          user.refreshTokens = user.refreshTokens.filter(
            (token: string) => token !== refreshToken
          );
          await user.save();
        }
      } catch {
        // even if token is expired/invalid, still clear cookie and return success
      }
      clearRefreshCookie(res);
      res.status(HTTP_STATUS.OK).json({ message: "logout success" });
    } catch (error) {
      console.error("Logout error:", error);
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server error" });
    }
  }

  static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId: string | undefined = req.userId;
      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Unauthorized" });
        return;
      }
      const user = await User.findById(userId).select(
        "-password -refreshTokens"
      );
      if (!user) {
        res.status(HTTP_STATUS.NOT_FOUND).json({ message: "User not found" });
        return;
      }
      res.status(HTTP_STATUS.OK).json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server error" });
    }
  }
}
