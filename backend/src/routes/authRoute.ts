import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account with username, email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Unique username
 *                 example: "testuser"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 description: User password (will be hashed)
 *                 minLength: 6
 *                 example: "securePassword123"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "507f1f77bcf86cd799439011"
 *                 username:
 *                   type: string
 *                   example: "testuser"
 *                 email:
 *                   type: string
 *                   example: "user@example.com"
 *       400:
 *         description: Bad request - Validation error or missing fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Validation error"
 *       500:
 *         description: Internal server error
 */
router.post("/register", AuthController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticates a user and returns an access token. A refresh token is stored in an HTTP-only cookie.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address (optional if username is provided)
 *                 example: "user@example.com"
 *               username:
 *                 type: string
 *                 description: Username (optional if email is provided)
 *                 example: "testuser"
 *               password:
 *                 type: string
 *                 description: User password
 *                 example: "securePassword123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 _id:
 *                   type: string
 *                   description: User ID
 *                   example: "507f1f77bcf86cd799439011"
 *       400:
 *         description: Bad request - Missing username/email or password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "missing email or password"
 *       401:
 *         description: Unauthorized - Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "email or password incorrect"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "internal server error"
 */
router.post("/login", AuthController.login);

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Login/register using Google
 *     description: Verifies a Google ID token and returns an access token. A refresh token is stored in an HTTP-only cookie.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token from the client
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Missing idToken
 *       401:
 *         description: Invalid Google token
 */
router.post("/google", AuthController.googleLogin);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Generates a new access token using a valid refresh token from an HTTP-only cookie (or request body).
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Optional refresh token (if cookie is not used)
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: New JWT access token
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 _id:
 *                   type: string
 *                   description: User ID
 *                   example: "507f1f77bcf86cd799439011"
 *       400:
 *         description: Bad request - Invalid or missing refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "fail"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "internal server error"
 */
router.post("/refresh", AuthController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Invalidates the refresh token and logs out the user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Optional refresh token to invalidate (if cookie is not used)
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "logout success"
 *       400:
 *         description: Bad request - Invalid or missing refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "failed to Logout"
 */
router.post("/logout", AuthController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user
 *     description: Returns the currently authenticated user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authMiddleware, AuthController.me);

export default router;
