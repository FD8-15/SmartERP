import { Router } from "express";
import {
    createCompany,
    getAllCompany,
    getCompany,
    addToCompany,
    updateCompany
} from "../controllers/company.controller.js";

import { auth } from "../middlewares/jwt.js";
import { company_access } from "../middlewares/company_access.middleware.js";
import { checkRole } from "../middlewares/checkRole.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    createCompanySchema,
    updateCompanySchema,
    companyIdParamsSchema,
    addUserToCompanySchema
} from "../schemas/company.schema.js";

const router = Router();

/**
 * @swagger
 * /api/v1/company:
 *   post:
 *     tags:
 *       - Companies
 *     summary: Create a new company
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Creates a new tenant company workspace and automatically registers the authenticated user
 *       as the `owner` of the company in `company_users`.
 *
 *       ### Access requirements
 *       - **Authentication:** Required (`accessToken` cookie).
 *       - **Company access:** Not applicable (creating new company).
 *       - **Required role:** Any authenticated user.
 *
 *       ### Business restrictions
 *       - A single user cannot create more than **5 companies** as `owner`.
 *       - The company name must be unique for the owner (case-insensitive comparison).
 *       - `financial_year_end` must be after or equal to `financial_year_start`.
 *
 *       ### Zod validation rules
 *       - `company_name`: String, 2 to 255 chars, trimmed.
 *       - `email`: String, valid email format.
 *       - `address`: String, 1 to 500 chars, trimmed.
 *       - `contact_number`: String, 10-digit Indian mobile number (`^[6-9]\d{9}$`).
 *       - `state`: String, 2 to 100 chars, trimmed.
 *       - `gst_no`: String, 15-character valid Indian GSTIN.
 *       - `financial_year_start`: Date string in `YYYY-MM-DD` format.
 *       - `financial_year_end`: Date string in `YYYY-MM-DD` format, >= financial_year_start.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company_name
 *               - email
 *               - address
 *               - contact_number
 *               - state
 *               - gst_no
 *               - financial_year_start
 *               - financial_year_end
 *             properties:
 *               company_name:
 *                 type: string
 *                 example: Acme Enterprises
 *               email:
 *                 type: string
 *                 format: email
 *                 example: info@acme.com
 *               address:
 *                 type: string
 *                 example: 101 Industrial Estate, Mumbai
 *               contact_number:
 *                 type: string
 *                 example: "9876543210"
 *               state:
 *                 type: string
 *                 example: Maharashtra
 *               gst_no:
 *                 type: string
 *                 example: 27ABCDE1234F1Z5
 *               financial_year_start:
 *                 type: string
 *                 format: date
 *                 example: 2026-04-01
 *               financial_year_end:
 *                 type: string
 *                 format: date
 *                 example: 2027-03-31
 *     responses:
 *       201:
 *         description: Company created successfully.
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
 *                     resp:
 *                       type: object
 *                       properties:
 *                         company_id:
 *                           type: integer
 *                           example: 1
 *                         company_name:
 *                           type: string
 *                           example: Acme Enterprises
 *                         email:
 *                           type: string
 *                           example: info@acme.com
 *                         address:
 *                           type: string
 *                           example: 101 Industrial Estate, Mumbai
 *                         contact_number:
 *                           type: string
 *                           example: "9876543210"
 *                         state:
 *                           type: string
 *                           example: Maharashtra
 *                         gst_no:
 *                           type: string
 *                           example: 27ABCDE1234F1Z5
 *                         financial_year_start:
 *                           type: string
 *                           example: "2026-03-31T18:30:00.000Z"
 *                         financial_year_end:
 *                           type: string
 *                           example: "2027-03-30T18:30:00.000Z"
 *                 message:
 *                   type: string
 *                   example: Company created succsfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Validation failed, limit of 5 companies reached, or duplicate company name.
 *       401:
 *         description: Unauthenticated user.
 */
router.post("/", auth, validate(createCompanySchema), createCompany);

/**
 * @swagger
 * /api/v1/company:
 *   get:
 *     tags:
 *       - Companies
 *     summary: Get all companies for current user
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Retrieves all companies where the authenticated user has an assigned role
 *       (`owner`, `manager`, or `employee`) from the `company_users` junction.
 *
 *       ### Access requirements
 *       - **Authentication:** Required (`accessToken` cookie).
 *       - **Company access:** Not applicable (returns list of all member companies).
 *     responses:
 *       200:
 *         description: Companies retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     result2:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           company_name:
 *                             type: string
 *                             example: Acme Enterprises
 *                           company_id:
 *                             type: integer
 *                             example: 1
 *                 message:
 *                   type: string
 *                   example: success
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: No companies found for this user.
 *       401:
 *         description: Unauthenticated user.
 */
router.get("/", auth, getAllCompany);

/**
 * @swagger
 * /api/v1/company/{company_id}:
 *   get:
 *     tags:
 *       - Companies
 *     summary: Get company profile by ID
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Retrieves the complete company profile for a specified company.
 *       The authenticated user must belong to this company.
 *
 *       ### Access requirements
 *       - **Authentication:** Required (`accessToken` cookie).
 *       - **Company access:** User must belong to `company_id`.
 *       - **Required role:** Any company member (`owner`, `manager`, or `employee`).
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *         description: Unique ID of the company.
 *     responses:
 *       200:
 *         description: Company details retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     result2:
 *                       type: object
 *                       properties:
 *                         company_id:
 *                           type: integer
 *                           example: 1
 *                         company_name:
 *                           type: string
 *                           example: Acme Enterprises
 *                         email:
 *                           type: string
 *                           example: info@acme.com
 *                         address:
 *                           type: string
 *                           example: 101 Industrial Estate, Mumbai
 *                         contact_number:
 *                           type: string
 *                           example: "9876543210"
 *                         state:
 *                           type: string
 *                           example: Maharashtra
 *                         gst_no:
 *                           type: string
 *                           example: 27ABCDE1234F1Z5
 *                         financial_year_start:
 *                           type: string
 *                           example: "2026-03-31T18:30:00.000Z"
 *                         financial_year_end:
 *                           type: string
 *                           example: "2027-03-30T18:30:00.000Z"
 *                 message:
 *                   type: string
 *                   example: success
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Company not found or invalid company_id parameter.
 *       401:
 *         description: Unauthenticated user.
 *       403:
 *         description: Forbidden. User does not have access to this company.
 */
router.get("/:company_id", auth, validate(companyIdParamsSchema), company_access, getCompany);

/**
 * @swagger
 * /api/v1/company/{company_id}/users:
 *   post:
 *     tags:
 *       - Companies
 *     summary: Add a user to company
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Grants a registered user access to this company with an assigned role (`manager` or `employee`).
 *
 *       ### Access requirements
 *       - **Authentication:** Required (`accessToken` cookie).
 *       - **Company access:** User must belong to `company_id`.
 *       - **Required role:** `owner` or `manager`.
 *
 *       ### Role hierarchy rules
 *       - An `owner` can add both `manager` and `employee` users.
 *       - A `manager` can only add `employee` users. A manager cannot add another manager (`403 Manager cannot add another manager`).
 *       - Role `owner` cannot be assigned via this endpoint.
 *
 *       ### Zod validation rules
 *       - `email`: String, valid email format, trimmed.
 *       - `role`: Enum `manager` or `employee` (case-insensitive).
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *         description: Unique ID of the company.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: colleague@example.com
 *                 description: Email address of the registered user to add.
 *               role:
 *                 type: string
 *                 enum: [manager, employee]
 *                 example: employee
 *                 description: Company role to assign.
 *     responses:
 *       201:
 *         description: User added successfully to company.
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
 *                     result3:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: integer
 *                           example: 15
 *                         company_id:
 *                           type: integer
 *                           example: 1
 *                         role:
 *                           type: string
 *                           example: employee
 *                 message:
 *                   type: string
 *                   example: User added successfully to company
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: User already belongs to this company or invalid role.
 *       403:
 *         description: Forbidden. Insufficient role or manager attempting to add manager.
 *       404:
 *         description: Target user email not found in users table.
 */
router.post("/:company_id/users", auth, validate(addUserToCompanySchema), company_access, checkRole("owner", "manager"), addToCompany);

/**
 * @swagger
 * /api/v1/company/{company_id}:
 *   patch:
 *     tags:
 *       - Companies
 *     summary: Update company profile
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Updates the profile and registration settings for an existing company.
 *       Only the company `owner` has permission to modify company information.
 *
 *       ### Access requirements
 *       - **Authentication:** Required (`accessToken` cookie).
 *       - **Company access:** User must belong to `company_id`.
 *       - **Required role:** `owner` ONLY.
 *
 *       ### Zod validation rules
 *       - Same field requirements as company creation.
 *       - `financial_year_end` >= `financial_year_start`.
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *         description: Unique ID of the company to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company_name
 *               - email
 *               - address
 *               - contact_number
 *               - state
 *               - gst_no
 *               - financial_year_start
 *               - financial_year_end
 *             properties:
 *               company_name:
 *                 type: string
 *                 example: Acme Corporation India
 *               email:
 *                 type: string
 *                 format: email
 *                 example: contact@acmecorp.com
 *               address:
 *                 type: string
 *                 example: 202 Commercial Tower, Mumbai
 *               contact_number:
 *                 type: string
 *                 example: "9876543210"
 *               state:
 *                 type: string
 *                 example: Maharashtra
 *               gst_no:
 *                 type: string
 *                 example: 27ABCDE1234F1Z5
 *               financial_year_start:
 *                 type: string
 *                 format: date
 *                 example: 2026-04-01
 *               financial_year_end:
 *                 type: string
 *                 format: date
 *                 example: 2027-03-31
 *     responses:
 *       200:
 *         description: Company updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     result2:
 *                       type: object
 *                       properties:
 *                         company_id:
 *                           type: integer
 *                           example: 1
 *                         company_name:
 *                           type: string
 *                           example: Acme Corporation India
 *                         email:
 *                           type: string
 *                           example: contact@acmecorp.com
 *                 message:
 *                   type: string
 *                   example: Update successful
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Validation failed or duplicate company name for this owner.
 *       401:
 *         description: Unauthenticated user.
 *       403:
 *         description: Forbidden. Only company owner can update company profile.
 *       404:
 *         description: Company not found.
 */
router.patch("/:company_id", auth, validate(updateCompanySchema), company_access, checkRole("owner"), updateCompany);

export default router;
