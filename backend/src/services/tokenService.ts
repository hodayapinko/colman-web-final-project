import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export type TokenType = 'access' | 'refresh';

export interface TokenPayload {
  _id: string;
  random: string;
  tokenType: TokenType;
  iat: number;
  exp: number;
}

export class TokenService {
  private static readonly ACCESS_TOKEN_EXPIRY = '15m';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';

  /**
   * Generates a pair of JWT tokens (access and refresh)
   */
  static generateTokenPair(userId: string): TokenPair | null {
    const secret = process.env.TOKEN_SECRET;
    
    if (!secret) {
      console.error('TOKEN_SECRET is not defined');
      return null;
    }

    const randomString = crypto.randomBytes(16).toString('hex');

    const accessPayload = { _id: userId, random: randomString, tokenType: 'access' as const };
    const refreshPayload = { _id: userId, random: randomString, tokenType: 'refresh' as const };

    const accessToken = jwt.sign(accessPayload, secret, { expiresIn: this.ACCESS_TOKEN_EXPIRY });
    const refreshToken = jwt.sign(refreshPayload, secret, { expiresIn: this.REFRESH_TOKEN_EXPIRY });

    return { accessToken, refreshToken };
  }

  /**
   * Verifies a JWT token and returns its payload
   */
  static async verifyToken(token: string): Promise<TokenPayload> {
    const secret = process.env.TOKEN_SECRET;
    
    if (!secret) {
      throw new Error('TOKEN_SECRET is not defined');
    }

    return new Promise((resolve, reject) => {
      jwt.verify(token, secret, (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded as TokenPayload);
        }
      });
    });
  }

  /**
   * Ensures the verified payload matches the expected token type.
   */
  static assertTokenType(payload: TokenPayload, expected: TokenType): void {
    if (!payload?.tokenType || payload.tokenType !== expected) {
      throw new Error('Invalid token type');
    }
  }

  /**
   * Extracts user ID from a verified token payload
   */
  static extractUserId(payload: TokenPayload): string {
    return payload._id;
  }
}
