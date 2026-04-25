import { Router } from "express";
import postRoutes from "./post.routes";
import userRoutes from "./user.routes";
import commentsRoutes from "./comment.routes";
import authRouter from "./authRoute";
import fileRoutes from "./file.routes";
import aiRoutes from "./ai.routes";

const router = Router();

router.use("/posts", postRoutes);
router.use("/users", userRoutes);
router.use("/comments", commentsRoutes);
router.use("/auth", authRouter);
router.use("/file", fileRoutes);
router.use("/ai", aiRoutes);

export default router;
