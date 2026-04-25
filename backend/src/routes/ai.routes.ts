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
 *     description: Uses embeddings + Gemini to answer questions based on post reviews. Filters by username, title, content, rating, and location.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AiSearchRequest'
 *     responses:
 *       200:
 *         description: AI answer and sources
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AiSearchResponse'
 *       400:
 *         description: Missing or empty query
 *       429:
 *         description: Rate limited or AI busy
 *       500:
 *         description: Internal server error
 */
router.post("/search", authMiddleware, aiSearch);

/**
 * @swagger
 * /api/ai/reindex-posts:
 *   post:
 *     summary: Reindex post embeddings
 *     description: Generates embeddings for posts that don't have them yet. Use ?force=true to re-embed all posts.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: force
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Set to "true" to re-embed all posts, even those already indexed
 *     responses:
 *       200:
 *         description: Reindex summary
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AiReindexResponse'
 *       500:
 *         description: Internal server error
 */
router.post("/reindex-posts", authMiddleware, reindexPosts);

export default router;
