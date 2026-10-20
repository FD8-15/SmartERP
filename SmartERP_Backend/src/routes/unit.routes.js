import { Router } from "express";
import {
  createUnit,
  getUnits,
  getOneUnit,
  updateUnit,
} from "../controllers/unit.controller.js";
import { auth } from "../middlewares/jwt.js";
import { company_access } from "../middlewares/company_access.middleware.js";
import { checkRole } from "../middlewares/checkRole.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Units
 *   description: Unit management APIs
 */

/**
 * @swagger
 * /api/v1/unit/{company_id}:
 *   post:
 *     summary: Create a unit
 *     description: Creates a new unit for a company. Requires owner or manager permissions.
 *     tags:
 *       - Units
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: Kilogram
 *               short_name:
 *                 type: string
 *                 example: kg
 *     responses:
 *       201:
 *         description: Unit created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied or insufficient permissions
 */
router.post(
  "/:company_id",
  auth,
  company_access,
  checkRole("owner", "manager"),
  createUnit
);

/**
 * @swagger
 * /api/v1/unit/{company_id}:
 *   get:
 *     summary: Get all units for a company
 *     description: Retrieves units belonging to the specified company.
 *     tags:
 *       - Units
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the company
 *     responses:
 *       200:
 *         description: Units retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access to the company denied
 */
router.get("/:company_id", auth, company_access, getUnits);

/**
 * @swagger
 * /api/v1/unit/{company_id}/{unit_id}:
 *   get:
 *     summary: Get a specific unit
 *     description: Retrieves one unit belonging to the specified company.
 *     tags:
 *       - Units
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the company
 *       - in: path
 *         name: unit_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the unit
 *     responses:
 *       200:
 *         description: Unit retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access to the company denied
 *       404:
 *         description: Unit not found
 */
router.get("/:company_id/:unit_id", auth, company_access, getOneUnit);

/**
 * @swagger
 * /api/v1/unit/{company_id}/{unit_id}:
 *   patch:
 *     summary: Update a unit
 *     description: Updates a unit belonging to a company. Requires owner or manager permissions.
 *     tags:
 *       - Units
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the company
 *       - in: path
 *         name: unit_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the unit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Kilogram
 *               short_name:
 *                 type: string
 *                 example: kg
 *     responses:
 *       200:
 *         description: Unit updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied or insufficient permissions
 *       404:
 *         description: Unit not found
 */
router.patch(
  "/:company_id/:unit_id",
  auth,
  company_access,
  checkRole("owner", "manager"),
  updateUnit
);

export default router;

