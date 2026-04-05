import { OAuth2Client } from "google-auth-library";
import User from "../models/User.model";

export interface GoogleUserPayload {
  email: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
  googleId: string;
}

export class OAuthService {
  private static client: OAuth2Client | null = null;

  private static getClient(): OAuth2Client {
    if (!this.client) {
      const clientId: string | undefined = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new Error("GOOGLE_CLIENT_ID is not defined");
      }
      this.client = new OAuth2Client(clientId);
    }
    return this.client;
  }

  /**
   * Verifies a Google ID token and extracts user information
   */
  static async verifyGoogleToken(idToken: string): Promise<GoogleUserPayload> {
    let payload: import("google-auth-library").TokenPayload | undefined;
    try {
      const client: OAuth2Client = this.getClient();
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      payload = ticket.getPayload();
    } catch (error) {
      throw new Error("Invalid Google token");
    }

    if (!payload || !payload.email) {
      throw new Error("Invalid token payload");
    }

    return {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      email_verified: payload.email_verified,
      googleId: payload.sub!,
    };
  }

  /**
   * Generates a unique username from email or name
   * Handles collisions by appending random numbers
   */
  static async generateUniqueUsername(
    email: string,
    name?: string
  ): Promise<string> {
    let baseUsername: string = name
      ? name.toLowerCase().replace(/[^a-z0-9_]/g, "_")
      : email
          .split("@")[0]
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "_");

    // Ensure username is at least 3 characters
    if (baseUsername.length < 3) {
      baseUsername = baseUsername.padEnd(3, "_");
    }

    // Truncate if too long
    if (baseUsername.length > 25) {
      baseUsername = baseUsername.substring(0, 25);
    }

    let username: string = baseUsername;
    let counter: number = 0;

    // Check for collisions and append numbers if needed
    while (await User.findOne({ username })) {
      counter++;
      const suffix: string = counter.toString();
      const maxBaseLength: number = 30 - suffix.length;
      username = baseUsername.substring(0, maxBaseLength) + suffix;
    }

    return username;
  }
}
