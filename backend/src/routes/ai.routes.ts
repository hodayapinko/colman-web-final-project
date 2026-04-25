import { Router } from "express";
import { aiSearch, reindexPosts } from "../controllers/ai.controller";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI-assisted search over post reviews
 */

/**
 * @swagger
 * /api/ai/search:
 *   post:
 *     summary: AI search over reviews
 *     description: Uses embeddings + Gemini to answer questions using only rating/location/content context.
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 example: "Best hotels in Paris with rating 5"
 *     responses:
 *       200:
 *         description: AI answer and sources
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   type: string
 *                   example: "Based on the reviews, ..."
 *                 sources:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       postId:
 *                         type: string
 *                         example: "507f1f77bcf86cd799439011"
 *                       location:
 *                         type: string
 *                         nullable: true
 *                         example: "Paris"
 *                       rating:
 *                         type: number
 *                         nullable: true
 *                         example: 5
 *       400:
 *         description: Missing query
 *       429:
 *         description: Rate limited / AI busy
 *       500:
 *         description: Internal server error
 */
router.post("/search", authMiddleware, aiSearch);

/**
 * @swagger
 * /api/ai/reindex-posts:
 *   post:
 *     summary: Reindex post embeddings
 *     description: Generates embeddings for posts that don't have them yet.
 *     tags: [AI]
 *     responses:
 *       200:
 *         description: Reindex summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 indexed:
 *                   type: number
 *                   example: 10
 *                 skipped:
 *                   type: number
 *                   example: 5
 *                 errors:
 *                   type: number
 *                   example: 0
 *       500:
 *         description: Internal server error
 */
router.post("/reindex-posts", authMiddleware, reindexPosts);

export default router;
