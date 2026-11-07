import { Router } from "express";
import {
    createCustomer,
    getAllCustomers,
    getOneCustomer,
    update
} from "../controllers/customer.controller.js";
import { checkRole } from "../middlewares/checkRole.middleware.js";
import { auth } from "../middlewares/jwt.js";
import { company_access } from "../middlewares/company_access.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    createCustomerSchema,
    updateCustomerSchema,
    getCustomersSchema,
    getOneCustomerSchema
} from "../schemas/customer.schema.js";

const router = Router();

/**
 * @swagger
 * /api/v1/customer/{company_id}:
 *   post:
 *     tags:
 *       - Customers
 *     summary: Create a customer
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Creates a new customer profile for the specified company.
 *       Contact number must be unique within the company.
 *
 *       ### Access requirements
 *       - **Authentication:** Required (`accessToken` cookie).
 *       - **Company access:** User must belong to `company_id`.
 *       - **Required role:** `owner` or `manager`.
 *
 *       ### Zod validation rules
 *       - `name`: String, trimmed, 2 to 255 chars, required.
 *       - `contact_no`: String, trimmed, valid 10-digit Indian mobile number (`^[6-9]\d{9}$`).
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
 *               - name
 *               - contact_no
 *             properties:
 *               name:
 *                 type: string
 *                 example: Priya Desai
 *               contact_no:
 *                 type: string
 *                 example: "9823012345"
 *     responses:
 *       201:
 *         description: Customer created successfully.
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
 *                     Customer:
 *                       type: object
 *                       properties:
 *                         customer_id:
 *                           type: integer
 *                           example: 12
 *                         company_id:
 *                           type: integer
 *                           example: 1
 *                         name:
 *                           type: string
 *                           example: Priya Desai
 *                         contact_no:
 *                           type: string
 *                           example: "9823012345"
 *                 message:
 *                   type: string
 *                   example: Customer created successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Validation failed or missing fields.
 *       401:
 *         description: Unauthenticated user.
 *       403:
 *         description: Access denied or insufficient role.
 *       409:
 *         description: Customer with this contact number already exists in this company.
 */
router.post(
    "/:company_id",
    auth,
    validate(createCustomerSchema),
    company_access,
    checkRole("owner", "manager"),
    createCustomer
);

/**
 * @swagger
 * /api/v1/customer/{company_id}:
 *   get:
 *     tags:
 *       - Customers
 *     summary: List customers with search and pagination
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Retrieves all customers for the company with optional ILIKE search filter on customer `name`
 *       and pagination parameters. Ordered by `customer_id ASC`.
 *
 *       ### Access requirements
 *       - **Authentication:** Required (`accessToken` cookie).
 *       - **Company access:** User must belong to `company_id`.
 *       - **Required role:** Any member (`owner`, `manager`, or `employee`).
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *         description: Unique ID of the company.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         example: Priya
 *         description: Search customers by name (ILIKE %search%).
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         example: 1
 *         description: Page number.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         example: 10
 *         description: Maximum records per page (up to 100).
 *     responses:
 *       200:
 *         description: Customers fetched successfully.
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
 *                     customers:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                 message:
 *                   type: string
 *                   example: customers fetched successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthenticated user.
 *       403:
 *         description: Access to company denied.
 */
router.get(
    "/:company_id",
    auth,
    validate(getCustomersSchema),
    company_access,
    getAllCustomers
);

/**
 * @swagger
 * /api/v1/customer/{company_id}/{customer_id}:
 *   get:
 *     tags:
 *       - Customers
 *     summary: Get customer by ID
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Retrieves profile details for a specific customer.
 *
 *       ### Access requirements
 *       - **Authentication:** Required (`accessToken` cookie).
 *       - **Company access:** User must belong to `company_id`.
 *       - **Required role:** Any member (`owner`, `manager`, or `employee`).
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *         description: Unique ID of the company.
 *       - in: path
 *         name: customer_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 12
 *         description: Unique ID of the customer.
 *     responses:
 *       200:
 *         description: Customer fetched successfully.
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
 *                     customer:
 *                       type: object
 *                       properties:
 *                         customer_id:
 *                           type: integer
 *                           example: 12
 *                         company_id:
 *                           type: integer
 *                           example: 1
 *                         name:
 *                           type: string
 *                           example: Priya Desai
 *                         contact_no:
 *                           type: string
 *                           example: "9823012345"
 *                 message:
 *                   type: string
 *                   example: customer fetched successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthenticated user.
 *       403:
 *         description: Access to company denied.
 *       404:
 *         description: Customer does not exist.
 */
router.get(
    "/:company_id/:customer_id",
    auth,
    validate(getOneCustomerSchema),
    company_access,
    getOneCustomer
);

/**
 * @swagger
 * /api/v1/customer/{company_id}/{customer_id}:
 *   patch:
 *     tags:
 *       - Customers
 *     summary: Update customer
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Updates the name or contact number for an existing customer.
 *       The contact number must not collide with another customer in the company.
 *
 *       ### Access requirements
 *       - **Authentication:** Required (`accessToken` cookie).
 *       - **Company access:** User must belong to `company_id`.
 *       - **Required role:** `owner` or `manager`.
 *
 *       ### Zod validation rules
 *       - `name`: String, 2 to 255 chars, trimmed.
 *       - `contact_no`: String, 10-digit Indian mobile number (`^[6-9]\d{9}$`).
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *         description: Unique ID of the company.
 *       - in: path
 *         name: customer_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 12
 *         description: Unique ID of the customer to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - contact_no
 *             properties:
 *               name:
 *                 type: string
 *                 example: Priya Desai Sharma
 *               contact_no:
 *                 type: string
 *                 example: "9823012345"
 *     responses:
 *       200:
 *         description: Customer updated successfully.
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
 *                     customerUpdated:
 *                       type: object
 *                       properties:
 *                         customer_id:
 *                           type: integer
 *                           example: 12
 *                         name:
 *                           type: string
 *                           example: Priya Desai Sharma
 *                         contact_no:
 *                           type: string
 *                           example: "9823012345"
 *                 message:
 *                   type: string
 *                   example: customer updated successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Validation failed or missing fields.
 *       401:
 *         description: Unauthenticated user.
 *       403:
 *         description: Access denied or insufficient permissions.
 *       404:
 *         description: Customer not found.
 *       409:
 *         description: Contact number already exists for another customer in this company.
 */
router.patch(
    "/:company_id/:customer_id",
    auth,
    validate(updateCustomerSchema),
    company_access,
    checkRole("owner", "manager"),
    update
);

export default router;
