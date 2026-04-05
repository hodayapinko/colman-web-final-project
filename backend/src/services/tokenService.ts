import jwt from "jsonwebtoken";
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

  /**
   * Generates a pair of JWT tokens (access and refresh)
   */
  static generateTokenPair(userId: string): TokenPair | null {
    const accessSecret: string | undefined =
      process.env.ACCESS_TOKEN_SECRET;
    const refreshSecret: string | undefined =
      process.env.REFRESH_TOKEN_SECRET;

    if (!accessSecret || !refreshSecret) {
      console.error(
        "Token secrets are not defined (need ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET)"
      );
      return null;
    }

    const randomString: string = crypto.randomBytes(16).toString("hex");

    const accessPayload = {
      _id: userId,
      random: randomString,
      tokenType: "access" as const,
    };
    const refreshPayload = {
      _id: userId,
      random: randomString,
      tokenType: "refresh" as const,
    };

    const accessToken: string = jwt.sign(accessPayload, accessSecret, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    });
    const refreshToken: string = jwt.sign(refreshPayload, refreshSecret, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Verifies a JWT token and returns its payload
   */
  static async verifyToken(token: string): Promise<TokenPayload> {
    const accessSecret: string | undefined = process.env.ACCESS_TOKEN_SECRET;
    const refreshSecret: string | undefined = process.env.REFRESH_TOKEN_SECRET;

    if (!accessSecret || !refreshSecret) {
      throw new Error("Token secrets are not defined");
    }

    const mapPayload = (raw: any): TokenPayload => ({
      _id: raw._id,
      random: raw.random,
      tokenType: raw.tokenType,
      issuedAt: raw.iat,
      expiresAt: raw.exp,
    });

    return new Promise<TokenPayload>((resolve, reject) => {
      jwt.verify(token, accessSecret, (err: Error | null, decoded: unknown) => {
        if (!err) {
          resolve(mapPayload(decoded));
        } else {
          jwt.verify(token, refreshSecret, (err2: Error | null, decoded2: unknown) => {
            if (err2) {
              reject(err2);
            } else {
              resolve(mapPayload(decoded2));
            }
          });
        }
      });
    });
  }

  /**
   * Ensures the verified payload matches the expected token type.
   */
  static assertTokenType(payload: TokenPayload, expected: TokenType): void {
    if (!payload?.tokenType || payload.tokenType !== expected) {
      throw new Error("Invalid token type");
    }
  }

  /**
   * Extracts user ID from a verified token payload
   */
  static extractUserId(payload: TokenPayload): string {
    return payload._id;
  }
}
