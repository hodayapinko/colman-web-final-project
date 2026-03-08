import { Request, Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { ObjectId, Document } from "mongoose";
import User from "../models/User.model";
import { IUser } from "../constants/constants";

type TToken = {
  accessToken: string;
  refreshToken: string;
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
  const email: string = req.body.email;
  const password: string = req.body.password;

  if (!email || !password) {
    return res.status(400).send({ message: "missing email or password" });
  }
  try {
    const userDB = await User.findOne({ email });
    if (!userDB) {
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
    const user = await verifyRefreshToken(req.body.refreshToken);
    await user.save();
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
    const user = await verifyRefreshToken(req.body.refreshToken);

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
    res.status(200).send({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      _id: user._id,
    });
  } catch (err) {
    res.status(400).send({ message: err });
  }
};

export default {
  register,
  login,
  refresh,
  logout,
};
