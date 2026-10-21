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

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management APIs
 */

/**
 * @swagger
 * /api/v1/category/{company_id}:
 *   post:
 *     summary: Create a category
 *     description: Creates a category for a company. Category names must be unique within the company.
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the company
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
 *                 description: Name of the category
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Category name is required
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Company access denied or insufficient permissions
 *       409:
 *         description: A category with this name already exists
 */
router.post(
    "/:company_id",
    auth,
    company_access,
    checkRole("owner", "manager"),
    createCategory
);

/**
 * @swagger
 * /api/v1/category/{company_id}:
 *   get:
 *     summary: Get all categories
 *     description: Retrieves categories belonging to a company, ordered alphabetically by category name.
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the company
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Company access denied
 *       404:
 *         description: No categories found for this company
 */
router.get("/:company_id", auth, company_access, getCategories);

/**
 * @swagger
 * /api/v1/category/{company_id}/{category_id}:
 *   get:
 *     summary: Get a category by ID
 *     description: Retrieves a specific category belonging to the specified company.
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the company
 *       - in: path
 *         name: category_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the category
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Company access denied
 *       404:
 *         description: Category not found
 */
router.get(
    "/:company_id/:category_id",
    auth,
    company_access,
    getOneCategory
);

/**
 * @swagger
 * /api/v1/category/{company_id}/{category_id}:
 *   patch:
 *     summary: Update a category
 *     description: Updates the name of an existing category. Only owners and managers can update categories.
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the company
 *       - in: path
 *         name: category_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the category
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
 *                 description: New name for the category
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Category name is required
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Company access denied or insufficient permissions
 *       404:
 *         description: Category not found
 *       409:
 *         description: Another category with this name already exists
 */
router.patch(
    "/:company_id/:category_id",
    auth,
    company_access,
    checkRole("owner", "manager"),
    updateCategory
);

/**
 * @swagger
 * /api/v1/category/{company_id}/{category_id}:
 *   delete:
 *     summary: Delete a category
 *     description: Deletes a category belonging to the specified company. Only owners and managers can delete categories.
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the company
 *       - in: path
 *         name: category_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the category
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Company access denied or insufficient permissions
 *       404:
 *         description: Category not found
 */
router.delete(
    "/:company_id/:category_id",
    auth,
    company_access,
    checkRole("owner", "manager"),
    deleteCategory
);

export default router;