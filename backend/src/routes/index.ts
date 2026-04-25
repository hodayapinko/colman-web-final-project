import { Router } from "express";
import postRoutes from "./post.routes";
import userRoutes from "./user.routes";
import commentsRoutes from "./comment.routes";
import authRouter from "./authRoute";
import fileRoutes from "./file.routes";
import aiRoutes from "./ai.routes";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.use("/posts", authMiddleware, postRoutes);
router.use("/users", authMiddleware, userRoutes);
router.use("/comments", authMiddleware, commentsRoutes);
router.use("/auth", authRouter);
router.use("/file", authMiddleware, fileRoutes);
router.use("/ai", authMiddleware,  aiRoutes);

export default router;
