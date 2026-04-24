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
}
