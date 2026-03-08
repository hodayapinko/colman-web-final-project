import { Request, Response } from 'express';

const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Extracts refresh token from request body or cookie
 */
export function getRefreshTokenFromRequest(req: Request): string | undefined {
  // Prioritize body over cookie
  return req.body.refreshToken || req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
}

/**
 * Sets HTTP-only cookie with refresh token
 */
export function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SEVEN_DAYS_MS
  });
}

/**
 * Clears the refresh token cookie
 */
export function clearRefreshCookie(res: Response): void {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0
  });
}
