import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authorization = req.header("authorization");
  const token = authorization && authorization.split(" ")[1];

  if (!token) {
    return res.status(401);
  }
  if (!process.env.TOKEN_SECRET) {
    console.log("Token not defined");
    res.status(500).send("Internal Server Error");
    return;
  }

  jwt.verify(token, process.env.TOKEN_SECRET, (err, payload) => {
    if (err) {
      res.status(401).send("Unauthorized");
      return;
    }
    req.params.userId = (payload as { _id: string })._id;
    next();
  });
};
