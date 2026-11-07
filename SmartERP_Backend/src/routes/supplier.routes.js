import { Router } from "express";

import {
    createSupplier,
    getAllSupplier,
    getOneSupplier,
    updateSupplier
} from "../controllers/supplier.controller.js";

import { checkRole } from "../middlewares/checkRole.middleware.js";
import { auth } from "../middlewares/jwt.js";
import { company_access } from "../middlewares/company_access.middleware.js";
import {
    createSupplierSchema,
    updateSupplierSchema
} from "../schemas/suppliers.schema.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/v1/supplier/{company_id}:
 *   post:
 *     tags:
 *       - Suppliers
 *     summary: Create a supplier
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Creates a new supplier account for the specified company.
 *       GST number must be unique within the company.
 *
 *       ### Access requirements
 *       - **Authentication:** Required (`accessToken` cookie).
 *       - **Company access:** User must belong to `company_id`.
 *       - **Required role:** `owner` or `manager`.
 *
 *       ### Zod validation rules
 *       - `name`: String, trimmed, 2 to 255 chars, required.
 *       - `contact_no`: String, 10-digit Indian mobile number (`^[6-9]\d{9}$`).
 *       - `email`: String, trimmed, valid email format, max 255 chars.
 *       - `address`: String, trimmed, 1 to 255 chars.
 *       - `gst_no`: String, exactly 15 characters, valid Indian GST format (`^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$`).
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
 *               - email
 *               - address
 *               - gst_no
 *             properties:
 *               name:
 *                 type: string
 *                 example: ABC Traders
 *               contact_no:
 *                 type: string
 *                 example: "9876543210"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: contact@abctraders.com
 *               address:
 *                 type: string
 *                 example: 123 Wholesale Market, Pune
 *               gst_no:
 *                 type: string
 *                 example: 27ABCDE1234F1Z5
 *     responses:
 *       201:
 *         description: Supplier created successfully.
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
 *                     supplier:
 *                       type: object
 *                       properties:
 *                         supplier_id:
 *                           type: integer
 *                           example: 8
 *                         company_id:
 *                           type: integer
 *                           example: 1
 *                         name:
 *                           type: string
 *                           example: ABC Traders
 *                         contact_no:
 *                           type: string
 *                           example: "9876543210"
 *                         email:
 *                           type: string
 *                           example: contact@abctraders.com
 *                         address:
 *                           type: string
 *                           example: 123 Wholesale Market, Pune
 *                         gst_no:
 *                           type: string
 *                           example: 27ABCDE1234F1Z5
 *                 message:
 *                   type: string
 *                   example: Supplier created successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Validation failed or missing required fields.
 *       401:
 *         description: Unauthenticated user.
 *       403:
 *         description: Access denied or insufficient permissions.
 *       409:
 *         description: Supplier with this GST number already exists in this company.
 */
router.post(
    "/:company_id",
    auth,
    validate(createSupplierSchema),
    company_access,
    checkRole("owner", "manager"),
    createSupplier
);

/**
 * @swagger
 * /api/v1/supplier/{company_id}:
 *   get:
 *     tags:
 *       - Suppliers
 *     summary: List suppliers with search and pagination
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Retrieves all suppliers for the company with optional ILIKE search filter on supplier `name`
 *       and pagination parameters. Ordered by `supplier_id ASC`.
 *
 *       ### Access requirements
 *       - **Authentication:** Required (`accessToken` cookie).
 *       - **Company access:** User must belong to `company_id`.
 *       - **Required role:** Any member (`owner`, `manager`, or `employee`).
 *
 *       ### Pagination defaults
 *       - `page`: Default is `1` (minimum `1`).
 *       - `limit`: Default is `10` (minimum `1`, maximum `100`).
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
 *         example: ABC
 *         description: Filter suppliers by name (ILIKE %search%).
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
 *         description: Page record limit (max 100).
 *     responses:
 *       200:
 *         description: Suppliers fetched successfully.
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
 *                     suppliers:
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
 *                   example: suppliers fetched successfully
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
    company_access,
    getAllSupplier
);

/**
 * @swagger
 * /api/v1/supplier/{company_id}/{supplier_id}:
 *   get:
 *     tags:
 *       - Suppliers
 *     summary: Get supplier by ID
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Retrieves the profile and GST details for a specific supplier.
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
 *         name: supplier_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 8
 *         description: Unique ID of the supplier.
 *     responses:
 *       200:
 *         description: Supplier fetched successfully.
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
 *                     supplier:
 *                       type: object
 *                       properties:
 *                         supplier_id:
 *                           type: integer
 *                           example: 8
 *                         company_id:
 *                           type: integer
 *                           example: 1
 *                         name:
 *                           type: string
 *                           example: ABC Traders
 *                         contact_no:
 *                           type: string
 *                           example: "9876543210"
 *                         email:
 *                           type: string
 *                           example: contact@abctraders.com
 *                         address:
 *                           type: string
 *                           example: 123 Wholesale Market, Pune
 *                         gst_no:
 *                           type: string
 *                           example: 27ABCDE1234F1Z5
 *                 message:
 *                   type: string
 *                   example: Supplier fetched successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthenticated user.
 *       403:
 *         description: Access to company denied.
 *       404:
 *         description: Supplier not found.
 */
router.get(
    "/:company_id/:supplier_id",
    auth,
    company_access,
    getOneSupplier
);

/**
 * @swagger
 * /api/v1/supplier/{company_id}/{supplier_id}:
 *   patch:
 *     tags:
 *       - Suppliers
 *     summary: Update supplier profile
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Updates information for an existing supplier.
 *       If GST number is updated, it must not collide with another supplier in the company.
 *
 *       ### Access requirements
 *       - **Authentication:** Required (`accessToken` cookie).
 *       - **Company access:** User must belong to `company_id`.
 *       - **Required role:** `owner` or `manager`.
 *
 *       ### Zod validation rules
 *       - Same field validation as supplier creation.
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *         description: Unique ID of the company.
 *       - in: path
 *         name: supplier_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 8
 *         description: Unique ID of the supplier to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - contact_no
 *               - email
 *               - address
 *               - gst_no
 *             properties:
 *               name:
 *                 type: string
 *                 example: ABC Traders Pvt Ltd
 *               contact_no:
 *                 type: string
 *                 example: "9876543210"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: accounts@abctraders.com
 *               address:
 *                 type: string
 *                 example: 125 Wholesale Market, Pune
 *               gst_no:
 *                 type: string
 *                 example: 27ABCDE1234F1Z5
 *     responses:
 *       200:
 *         description: Supplier updated successfully.
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
 *                     supplierUpdated:
 *                       type: object
 *                       properties:
 *                         supplier_id:
 *                           type: integer
 *                           example: 8
 *                         name:
 *                           type: string
 *                           example: ABC Traders Pvt Ltd
 *                         gst_no:
 *                           type: string
 *                           example: 27ABCDE1234F1Z5
 *                 message:
 *                   type: string
 *                   example: Supplier updated successfully
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
 *         description: Supplier not found.
 *       409:
 *         description: GST number already registered to another supplier in this company.
 */
router.patch(
    "/:company_id/:supplier_id",
    auth,
    validate(updateSupplierSchema),
    company_access,
    checkRole("owner", "manager"),
    updateSupplier
);

export default router;
