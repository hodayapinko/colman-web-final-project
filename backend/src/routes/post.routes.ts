import { Router } from "express";
import { getAllPosts, getPostsByUserId, getPostById, createPost, updatePost } from "../controllers/post.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Post management endpoints
 */

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts or filter posts by user ID
 *     description: |
 *       Retrieves posts from the database.
 *       - Without query parameters: Returns all posts
 *       - With userId parameter: Returns only posts created by the specified user
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter posts by user ID (MongoDB ObjectId). If provided, returns only posts created by this user.
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Posts retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *             examples:
 *               allPosts:
 *                 summary: Get all posts
 *                 value:
 *                   success: true
 *                   message: Posts retrieved successfully
 *                   data:
 *                     - _id: "507f1f77bcf86cd799439011"
 *                       title: "Introduction to Node.js"
 *                       content: "This is a comprehensive guide to Node.js"
 *                       user: "507f1f77bcf86cd799439012"
 *                       createdAt: "2024-01-15T10:30:00.000Z"
 *                       updatedAt: "2024-01-15T10:30:00.000Z"
 *                     - _id: "507f1f77bcf86cd799439013"
 *                       title: "Advanced TypeScript"
 *                       content: "Deep dive into TypeScript features"
 *                       user: "507f1f77bcf86cd799439014"
 *                       createdAt: "2024-01-16T14:20:00.000Z"
 *                       updatedAt: "2024-01-16T14:20:00.000Z"
 *               postsByUser:
 *                 summary: Get posts by specific user (with ?userId=507f1f77bcf86cd799439012)
 *                 value:
 *                   success: true
 *                   message: "Posts by user 507f1f77bcf86cd799439012 retrieved successfully"
 *                   data:
 *                     - _id: "507f1f77bcf86cd799439011"
 *                       title: "Introduction to Node.js"
 *                       content: "This is a comprehensive guide to Node.js"
 *                       user: "507f1f77bcf86cd799439012"
 *                       createdAt: "2024-01-15T10:30:00.000Z"
 *                       updatedAt: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Invalid user ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid user ID
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *                 error:
 *                   type: string
 *                   example: Database error
 */
router.get("/", (req, res, next) => {
  if (req.query.userId) {
    return getPostsByUserId(req, res);
  }
  next();
});

router.get("/", getAllPosts);

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Get post by ID
 *     description: Retrieves a specific post by its ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the post
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Post retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Post not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *                 error:
 *                   type: string
 *                   example: Database error
 */
router.get("/:id", getPostById);

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     description: Creates a new post with title, content, and userId
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - userId
 *             properties:
 *               title:
 *                 type: string
 *                 description: Post title (3-200 characters)
 *                 minLength: 3
 *                 maxLength: 200
 *                 example: "Introduction to Node.js"
 *               content:
 *                 type: string
 *                 description: Post content (minimum 10 characters)
 *                 minLength: 10
 *                 example: "This is a comprehensive guide to getting started with Node.js development."
 *               userId:
 *                 type: string
 *                 description: MongoDB ObjectId of the user creating the post
 *                 example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Post created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Bad request - Missing fields or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Missing required fields: title, content, and userId are required"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *                 error:
 *                   type: string
 *                   example: Database error
 */
router.post("/", createPost);

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Update a post
 *     description: Updates an existing post's title, content, or userId
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the post
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Updated post title (3-200 characters)
 *                 minLength: 3
 *                 maxLength: 200
 *                 example: "Updated: Introduction to Node.js"
 *               content:
 *                 type: string
 *                 description: Updated post content (minimum 10 characters)
 *                 minLength: 10
 *                 example: "This is an updated and comprehensive guide to Node.js."
 *               userId:
 *                 type: string
 *                 description: MongoDB ObjectId of the user (to reassign post)
 *                 example: "507f1f77bcf86cd799439015"
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Post updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Bad request - Missing fields or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "At least one field (title, content, or userId) must be provided for update"
 *       404:
 *         description: Post or User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Post not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *                 error:
 *                   type: string
 *                   example: Database error
 */
router.put("/:id", updatePost);

export default router;

