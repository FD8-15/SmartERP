import { Router } from "express";
import { register, login, logout } from "../controllers/user.controller.js";
import { auth } from "../middlewares/jwt.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerUserSchema, loginUserSchema } from "../schemas/user.schema.js";

const router = Router();

/**
 * @swagger
 * /api/v1/users/register:
 *   post:
 *     tags:
 *       - Users
 *     summary: Register a new user
 *     description: |
 *       Creates a new user account with an encrypted password using bcrypt.
 *       The email must be unique across the entire system.
 *
 *       ### Access requirements
 *       - **Authentication:** None (Public endpoint).
 *       - **Company access:** Not applicable.
 *       - **Required role:** Any public visitor.
 *
 *       ### Zod validation rules
 *       - `name`: String, trimmed, required, 2 to 100 characters.
 *       - `email`: String, trimmed, required, valid email format.
 *       - `password`: String, required, 6 to 100 characters.
 *     requestBody:
 *       required: true
 *       description: Registration payload containing name, email, and password.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Rajesh Sharma
 *                 description: Full name of the user (2 to 100 chars).
 *               email:
 *                 type: string
 *                 format: email
 *                 example: rajesh.sharma@example.com
 *                 description: Unique email address used for login.
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123
 *                 description: User password (minimum 6 characters).
 *     responses:
 *       201:
 *         description: User registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 201
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: integer
 *                       example: 12
 *                     name:
 *                       type: string
 *                       example: Rajesh Sharma
 *                     email:
 *                       type: string
 *                       example: rajesh.sharma@example.com
 *                 message:
 *                   type: string
 *                   example: Success
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Validation failed or email already registered.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: User already registered
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.route("/register").post(validate(registerUserSchema), register);

/**
 * @swagger
 * /api/v1/users/login:
 *   post:
 *     tags:
 *       - Users
 *     summary: User login
 *     description: |
 *       Authenticates user credentials against the database using bcrypt comparison.
 *       Upon successful authentication, generates a short-lived access token (1 day)
 *       and a long-lived refresh token (10 days). Both tokens are set in secure,
 *       HTTP-only cookies (`accessToken` and `refreshToken`), and also returned in the JSON body.
 *
 *       ### Access requirements
 *       - **Authentication:** None (Public endpoint).
 *       - **Company access:** Not applicable.
 *       - **Required role:** Any registered user.
 *
 *       ### Zod validation rules
 *       - `email`: String, trimmed, required, valid email format.
 *       - `password`: String, required, at least 1 character.
 *     requestBody:
 *       required: true
 *       description: Login credentials.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: rajesh.sharma@example.com
 *                 description: Registered email address.
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123
 *                 description: Account password.
 *     responses:
 *       200:
 *         description: Login successful. Cookies `accessToken` and `refreshToken` are set.
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: accessToken=jwt_token_here; Path=/; HttpOnly; Secure
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: integer
 *                       example: 12
 *                     name:
 *                       type: string
 *                       example: Rajesh Sharma
 *                     email:
 *                       type: string
 *                       example: rajesh.sharma@example.com
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Invalid credentials or missing fields.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: User email or password is invalid
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.route("/login").post(validate(loginUserSchema), login);

/**
 * @swagger
 * /api/v1/users/logout:
 *   post:
 *     tags:
 *       - Users
 *     summary: User logout
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Logs out the currently authenticated user. Clears the `refresh_token` stored in the
 *       PostgreSQL `users` record and clears the `accessToken` and `refreshToken` HTTP-only cookies.
 *
 *       ### Access requirements
 *       - **Authentication:** Required via HTTP-only `accessToken` cookie.
 *       - **Company access:** Not applicable.
 *       - **Required role:** Authenticated user.
 *     responses:
 *       200:
 *         description: Successfully logged out and cookies cleared.
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
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
 *                   example: User logged out successfully
 *       401:
 *         description: Unauthorized. Missing or expired accessToken cookie.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 401
 *                 message:
 *                   type: string
 *                   example: Please Login
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.route("/logout").post(auth, logout);

export default router;
