import { Router } from "express";
import {
    createCategory,
    getCategories,
    getOneCategory,
    updateCategory,
    deleteCategory
} from "../controllers/categories.controller.js";

import { auth } from "../middlewares/jwt.js";
import { company_access } from "../middlewares/company_access.middleware.js";
import { checkRole } from "../middlewares/checkRole.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    createCategorySchema,
    updateCategorySchema,
    getCategoriesSchema,
    categoryIdParamsSchema
} from "../schemas/category.schema.js";

const router = Router();

/**
 * @swagger
 * /api/v1/category/{company_id}:
 *   post:
 *     tags:
 *       - Categories
 *     summary: Create a category
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Creates a new product classification category for a company.
 *       Category names must be unique within the company (case-insensitive check).
 *
 *       ### Access requirements
 *       - **Authentication:** Required (`accessToken` cookie).
 *       - **Company access:** User must belong to `company_id`.
 *       - **Required role:** `owner` or `manager`.
 *
 *       ### Zod validation rules
 *       - `category_name`: String, trimmed, 2 to 255 characters, required.
 *       - `company_id`: Positive integer path parameter.
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *         description: ID of the company.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category_name
 *             properties:
 *               category_name:
 *                 type: string
 *                 example: Electronics
 *                 description: Unique name of the category (2 to 255 chars).
 *     responses:
 *       201:
 *         description: Category created successfully.
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
 *                     category_id:
 *                       type: integer
 *                       example: 5
 *                     company_id:
 *                       type: integer
 *                       example: 1
 *                     category_name:
 *                       type: string
 *                       example: Electronics
 *                 message:
 *                   type: string
 *                   example: Category created successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Validation failed or category name missing.
 *       401:
 *         description: Unauthenticated user.
 *       403:
 *         description: Company access denied or insufficient role.
 *       409:
 *         description: A category with this name already exists in the company.
 */
router.post(
    "/:company_id",
    auth,
    validate(createCategorySchema),
    company_access,
    checkRole("owner", "manager"),
    createCategory
);

/**
 * @swagger
 * /api/v1/category/{company_id}:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Get all categories
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Retrieves all categories belonging to a company, ordered alphabetically by `category_name`.
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
 *         description: ID of the company.
 *     responses:
 *       200:
 *         description: Categories retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category_id:
 *                         type: integer
 *                         example: 5
 *                       company_id:
 *                         type: integer
 *                         example: 1
 *                       category_name:
 *                         type: string
 *                         example: Electronics
 *                 message:
 *                   type: string
 *                   example: Categories fetched successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthenticated user.
 *       403:
 *         description: Company access denied.
 *       404:
 *         description: No categories found for this company.
 */
router.get(
    "/:company_id",
    auth,
    validate(getCategoriesSchema),
    company_access,
    getCategories
);

/**
 * @swagger
 * /api/v1/category/{company_id}/{category_id}:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Get a category by ID
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Retrieves details of a specific category belonging to the specified company.
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
 *         description: ID of the company.
 *       - in: path
 *         name: category_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 5
 *         description: ID of the category.
 *     responses:
 *       200:
 *         description: Category retrieved successfully.
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
 *                     category_id:
 *                       type: integer
 *                       example: 5
 *                     company_id:
 *                       type: integer
 *                       example: 1
 *                     category_name:
 *                       type: string
 *                       example: Electronics
 *                 message:
 *                   type: string
 *                   example: Category fetched successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthenticated user.
 *       403:
 *         description: Company access denied.
 *       404:
 *         description: Category not found.
 */
router.get(
    "/:company_id/:category_id",
    auth,
    validate(categoryIdParamsSchema),
    company_access,
    getOneCategory
);

/**
 * @swagger
 * /api/v1/category/{company_id}/{category_id}:
 *   patch:
 *     tags:
 *       - Categories
 *     summary: Update a category
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Updates the name of an existing category. Only owners and managers can update categories.
 *       The updated category name must be unique within the company.
 *
 *       ### Access requirements
 *       - **Authentication:** Required (`accessToken` cookie).
 *       - **Company access:** User must belong to `company_id`.
 *       - **Required role:** `owner` or `manager`.
 *
 *       ### Zod validation rules
 *       - `category_name`: String, trimmed, 2 to 255 characters, required.
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *         description: ID of the company.
 *       - in: path
 *         name: category_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 5
 *         description: ID of the category.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category_name
 *             properties:
 *               category_name:
 *                 type: string
 *                 example: Home Appliances
 *                 description: New name for the category.
 *     responses:
 *       200:
 *         description: Category updated successfully.
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
 *                     category_id:
 *                       type: integer
 *                       example: 5
 *                     company_id:
 *                       type: integer
 *                       example: 1
 *                     category_name:
 *                       type: string
 *                       example: Home Appliances
 *                 message:
 *                   type: string
 *                   example: Category updated successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Category name is required or validation failed.
 *       401:
 *         description: Authentication required.
 *       403:
 *         description: Company access denied or insufficient permissions.
 *       404:
 *         description: Category not found.
 *       409:
 *         description: Another category with this name already exists in this company.
 */
router.patch(
    "/:company_id/:category_id",
    auth,
    validate(updateCategorySchema),
    company_access,
    checkRole("owner", "manager"),
    updateCategory
);

/**
 * @swagger
 * /api/v1/category/{company_id}/{category_id}:
 *   delete:
 *     tags:
 *       - Categories
 *     summary: Delete a category
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Deletes a category from the specified company. Only owners and managers can delete categories.
 *
 *       ### Access requirements
 *       - **Authentication:** Required (`accessToken` cookie).
 *       - **Company access:** User must belong to `company_id`.
 *       - **Required role:** `owner` or `manager`.
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *         description: ID of the company.
 *       - in: path
 *         name: category_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 5
 *         description: ID of the category to delete.
 *     responses:
 *       200:
 *         description: Category deleted successfully.
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
 *                     category_id:
 *                       type: integer
 *                       example: 5
 *                     company_id:
 *                       type: integer
 *                       example: 1
 *                     category_name:
 *                       type: string
 *                       example: Home Appliances
 *                 message:
 *                   type: string
 *                   example: Category deleted successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Authentication required.
 *       403:
 *         description: Company access denied or insufficient permissions.
 *       404:
 *         description: Category not found.
 */
router.delete(
    "/:company_id/:category_id",
    auth,
    validate(categoryIdParamsSchema),
    company_access,
    checkRole("owner", "manager"),
    deleteCategory
);

export default router;
