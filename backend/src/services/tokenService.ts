import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  _id: string;
  random: string;
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
    const payload = { _id: userId, random: randomString };
    
    const accessToken = jwt.sign(payload, secret, { expiresIn: this.ACCESS_TOKEN_EXPIRY });
    const refreshToken = jwt.sign(payload, secret, { expiresIn: this.REFRESH_TOKEN_EXPIRY });

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
   * Extracts user ID from a verified token payload
   */
  static extractUserId(payload: TokenPayload): string {
    return payload._id;
  }
}
