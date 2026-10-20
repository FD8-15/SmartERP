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
 * /api/v1/unit/{company_id}:
 *   post:
 *     tags:
 *       - Units
 *     summary: Create a measurement unit
 *     operationId: createUnit
 *     description: |
 *       Creates a new measurement unit for a company in SmartERP.
 *
 *       ### Access requirements
 *
 *       - **Authentication:** Required.
 *       - **Company access:** The user must have access to the specified company.
 *       - **Required role:** `owner` or `manager`.
 *
 *       ### When should I use this endpoint?
 *
 *       Use this endpoint to create a measurement unit that can be used
 *       when managing inventory, such as Kilogram, Litre, or Piece.
 *
 *       ### Before sending the request
 *
 *       1. Authenticate the user.
 *       2. Provide the company ID in the URL.
 *       3. Send the unit details as a JSON request body.
 *
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         description: Unique ID of the company in which the unit will be created.
 *         schema:
 *           type: integer
 *         example: 1
 *
 *     requestBody:
 *       required: true
 *       description: Details of the measurement unit to create.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Full name of the measurement unit.
 *                 example: Kilogram
 *               short_name:
 *                 type: string
 *                 description: Short abbreviation used to identify the unit.
 *                 example: kg
 *           example:
 *             name: Kilogram
 *             short_name: kg
 *
 *     responses:
 *       201:
 *         description: |
 *           **Unit created successfully.**
 *
 *           The server accepted the request and created the new measurement unit.
 *
 *       400:
 *         description: |
 *           **Invalid request data.**
 *
 *           Check that the submitted unit details satisfy the API's validation rules.
 *
 *       401:
 *         description: |
 *           **Authentication required.**
 *
 *           Provide valid authentication credentials before accessing this endpoint.
 *
 *       403:
 *         description: |
 *           **Access denied.**
 *
 *           The authenticated user may not have access to this company
 *           or may not have the required `owner` or `manager` role.
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

