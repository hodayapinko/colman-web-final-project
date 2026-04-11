import jwt, { JwtPayload } from "jsonwebtoken";
import crypto from "crypto";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export type TokenType = "access" | "refresh";

export interface TokenPayload {
  _id: string;
  random: string;
  tokenType: TokenType;
  issuedAt: number;
  expiresAt: number;
}

export class TokenService {
  private static readonly ACCESS_TOKEN_EXPIRY = "15m";
  private static readonly REFRESH_TOKEN_EXPIRY = "7d";

  private static getAccessSecret(): string {
    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) throw new Error("Missing ACCESS_TOKEN_SECRET");
    return secret;
  }

  private static getRefreshSecret(): string {
    const secret = process.env.REFRESH_TOKEN_SECRET;
    if (!secret) throw new Error("Missing REFRESH_TOKEN_SECRET");
    return secret;
  }

  /**
   * Generates tokens
   */
  static generateTokenPair(userId: string): TokenPair {
    const randomString = crypto.randomBytes(16).toString("hex");

    const accessToken = jwt.sign(
      { _id: userId, random: randomString, tokenType: "access" },
      this.getAccessSecret(),
      { expiresIn: this.ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { _id: userId, random: randomString, tokenType: "refresh" },
      this.getRefreshSecret(),
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    );

    return { accessToken, refreshToken };
  }

  static verifyAccessToken(token: string): TokenPayload {
    const decodedToken = jwt.verify(token, this.getAccessSecret()) as JwtPayload;
    return this.mapPayload(decodedToken);
  }

  static verifyRefreshToken(token: string): TokenPayload {
    const decodedToken = jwt.verify(token, this.getRefreshSecret()) as JwtPayload;
    return this.mapPayload(decodedToken);
  }

  /**
   * Shared mapper
   */
  private static mapPayload(raw: JwtPayload): TokenPayload {
    return {
      _id: raw._id,
      random: raw.random,
      tokenType: raw.tokenType,
      issuedAt: raw.iat!,
      expiresAt: raw.exp!,
    };
  }

  static extractUserIdFromToken(payload: TokenPayload): string {
    return payload._id;
  }
}