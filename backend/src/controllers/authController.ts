import { Request, Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { ObjectId, Document } from "mongoose";
import User from "../models/User.model";
import { IUser } from "../constants/constants";
import { OAuth2Client } from "google-auth-library";

type TToken = {
  accessToken: string;
  refreshToken: string;
};

const REFRESH_COOKIE_NAME = "refreshToken";

const getRefreshTokenFromRequest = (req: Request): string | undefined => {
  const fromBody = typeof req.body?.refreshToken === "string" ? req.body.refreshToken : undefined;
  const fromCookie = typeof req.cookies?.[REFRESH_COOKIE_NAME] === "string"
    ? (req.cookies[REFRESH_COOKIE_NAME] as string)
    : undefined;
  return fromBody || fromCookie;
};

const setRefreshCookie = (res: Response, refreshToken: string) => {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearRefreshCookie = (res: Response) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    path: "/api/auth",
  });
};

const register = async (req: Request, res: Response) => {
  try {
    const username: string | undefined = req.body.username;
    const email: string | undefined = req.body.email;
    const password: string | undefined = req.body.password;

    if (!username || !email || !password) {
      return res
        .status(400)
        .send({ message: "missing username, email or password" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).send({
      _id: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (err) {
    res.status(400).send(err);
  }
};

const login = async (req: Request, res: Response) => {
  const email: string | undefined = req.body.email;
  const username: string | undefined = req.body.username;
  const password: string = req.body.password;

  if ((!email && !username) || !password) {
    return res
      .status(400)
      .send({ message: "missing username/email or password" });
  }
  try {
    const userDB = await User.findOne(email ? { email } : { username });
    if (!userDB) {
      res.status(401).send({ message: "email or password incorrect" });
      return;
    }

    if (!userDB.password) {
      res.status(401).send({ message: "email or password incorrect" });
      return;
    }
    const validPassword = await bcrypt.compare(
      password,
      userDB.password || "",
    );
    if (!validPassword) {
      res.status(401).send({ message: "email or password incorrect" });
      return;
    }

    const token = generateToken(userDB._id as any);
    if (!token) {
      res.status(500).send({ message: "internal server error" });
      return;
    }
    if (!userDB.refreshTokens) {
      userDB.refreshTokens = [];
    }
    userDB.refreshTokens.push(token.refreshToken);

    await userDB.save();
    setRefreshCookie(res, token.refreshToken);
    res.status(200).send({
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      _id: userDB._id,
    });
  } catch (err) {
    res.status(400).send(err);
  }
};

const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = getRefreshTokenFromRequest(req);
    const user = await verifyRefreshToken(refreshToken);
    await user.save();
    clearRefreshCookie(res);
    res.status(200).send({ message: "logout success" });
  } catch (err) {
    res.status(400).send({ message: "failed to Logout" });
  }
};

const generateToken = (userId: ObjectId): TToken | null => {
  const tokenSecret = process.env.TOKEN_SECRET;
  if (!tokenSecret) {
    return null;
  }

  const random = Math.random().toString();
  const tokenExpires: string = process.env.TOKEN_EXPIRES || "1h";
  const refreshTokenExpires: string = process.env.REFRESH_TOKEN_EXPIRES || "7d";

  const signOptions: SignOptions = { expiresIn: tokenExpires as any };
  const refreshSignOptions: SignOptions = {
    expiresIn: refreshTokenExpires as any,
  };

  const accessToken: string = jwt.sign(
    {
      _id: userId.toString(),
      random: random,
    },
    tokenSecret,
    signOptions,
  );

  const refreshToken: string = jwt.sign(
    {
      _id: userId.toString(),
      random: random,
    },
    tokenSecret,
    refreshSignOptions,
  );
  return {
    accessToken: accessToken,
    refreshToken: refreshToken,
  };
};

const verifyRefreshToken = (refreshToken: string | undefined) => {
  return new Promise<Document & IUser>((resolve, reject) => {
    if (!refreshToken) {
      reject("fail");
      return;
    }
    if (!process.env.TOKEN_SECRET) {
      reject("fail");
      return;
    }
    jwt.verify(
      refreshToken,
      process.env.TOKEN_SECRET,
      async (err: any, payload: any) => {
        if (err) {
          reject("fail");
          return;
        }

        const userId = payload._id;
        try {
          const userDB = await User.findById(userId);
          if (!userDB) {
            reject("fail");
            return;
          }
          if (
            !userDB.refreshTokens ||
            !userDB.refreshTokens.includes(refreshToken)
          ) {
            userDB.refreshTokens = [];
            await userDB.save();
            reject("fail");
            return;
          }
          const tokens = userDB.refreshTokens!.filter(
            (token) => token !== refreshToken,
          );
          userDB.refreshTokens = tokens;

          resolve(userDB);
        } catch (err) {
          reject("fail");
          return;
        }
      },
    );
  });
};

const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = getRefreshTokenFromRequest(req);
    const user = await verifyRefreshToken(refreshToken);

    if (!user._id) {
      res.status(400).send({ message: "fail" });
      return;
    }

    const tokens = generateToken(user._id as any);

    if (!tokens) {
      res.status(500).send({ message: "internal server error" });
      return;
    }
    if (!user.refreshTokens) {
      user.refreshTokens = [];
    }
    user.refreshTokens.push(tokens.refreshToken);
    await user.save();
    setRefreshCookie(res, tokens.refreshToken);
    res.status(200).send({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      _id: user._id,
    });
  } catch (err) {
    res.status(400).send({ message: err });
  }
};

const googleLogin = async (req: Request, res: Response) => {
  const idToken: string | undefined = req.body?.idToken;
  if (!idToken) {
    return res.status(400).send({ message: "missing idToken" });
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    return res
      .status(500)
      .send({ message: "GOOGLE_CLIENT_ID is not defined" });
  }

  try {
    const client = new OAuth2Client(googleClientId);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: googleClientId,
    });
    const payload = ticket.getPayload();

    const email = payload?.email;
    if (!email) {
      return res.status(401).send({ message: "invalid Google token" });
    }

    let userDB = await User.findOne({ email });

    if (!userDB) {
      const baseUsername = (payload?.name || email.split("@")[0] || "user")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_")
        .slice(0, 20);

      let created = false;
      let attempt = 0;
      while (!created && attempt < 5) {
        const candidateUsername =
          attempt === 0
            ? baseUsername
            : `${baseUsername}_${Math.floor(Math.random() * 10000)}`;
        try {
          userDB = await User.create({
            username: candidateUsername,
            email,
            profilePicture: payload?.picture,
          });
          created = true;
        } catch (err) {
          attempt += 1;
          if (attempt >= 5) {
            throw err;
          }
        }
      }
    }

    const token = generateToken(userDB!._id as any);
    if (!token) {
      return res.status(500).send({ message: "internal server error" });
    }

    if (!userDB!.refreshTokens) {
      userDB!.refreshTokens = [];
    }
    userDB!.refreshTokens.push(token.refreshToken);
    await (userDB as any).save?.();

    setRefreshCookie(res, token.refreshToken);

    return res.status(200).send({
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      _id: userDB!._id,
    });
  } catch (err) {
    return res.status(401).send({ message: "invalid Google token" });
  }
};

const me = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const userDB = await User.findById(userId).select("_id username email age bio profilePicture");
    if (!userDB) {
      return res.status(404).send({ message: "user not found" });
    }
    return res.status(200).send(userDB);
  } catch (err) {
    return res.status(400).send({ message: "fail" });
  }
};

export default {
  register,
  login,
  googleLogin,
  refresh,
  logout,
  me,
};
