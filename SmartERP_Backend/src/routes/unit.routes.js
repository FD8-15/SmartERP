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
import { validate } from "../middlewares/validate.middleware.js";
import {
  createUnitSchema,
  updateUnitSchema,
  getUnitsSchema,
  unitIdParamsSchema
} from "../schemas/unit.schema.js";

const router = Router();

/**
 * @swagger
 * /api/v1/unit/{company_id}:
 *   post:
 *     tags:
 *       - Units
 *     summary: Create a measurement unit
 *     operationId: createUnit
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Creates a new inventory measurement unit (e.g., Kilogram, Litre, Piece, Box) for a company.
 *       Unit names must be unique within the company (case-insensitive check).
 *
 *       ### Access requirements
 *       - **Authentication:** Required (`accessToken` cookie).
 *       - **Company access:** User must belong to `company_id`.
 *       - **Required role:** `owner` or `manager`.
 *
 *       ### Zod validation rules
 *       - `unit_name`: String, trimmed, 1 to 50 characters, required.
 *       - `company_id`: Positive integer path parameter.
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
 *               - unit_name
 *             properties:
 *               unit_name:
 *                 type: string
 *                 example: Kilogram
 *                 description: Name of the measurement unit (e.g. Kilogram, Litre, Box).
 *     responses:
 *       201:
 *         description: Unit created successfully.
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
 *                     unit_id:
 *                       type: integer
 *                       example: 4
 *                     company_id:
 *                           type: integer
 *                           example: 1
 *                     unit_name:
 *                       type: string
 *                       example: Kilogram
 *                 message:
 *                   type: string
 *                   example: Unit created successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Validation failed or unit name missing.
 *       401:
 *         description: Unauthenticated user.
 *       403:
 *         description: Access denied or insufficient role (employees cannot create units).
 *       409:
 *         description: Unit already exists in this company.
 */
router.post(
  "/:company_id",
  auth,
  validate(createUnitSchema),
  company_access,
  checkRole("owner", "manager"),
  createUnit
);

/**
 * @swagger
 * /api/v1/unit/{company_id}:
 *   get:
 *     tags:
 *       - Units
 *     summary: Get all units for a company
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Retrieves all measurement units configured for a company, ordered alphabetically by `unit_name`.
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
 *     responses:
 *       200:
 *         description: Units retrieved successfully.
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
 *                       unit_id:
 *                         type: integer
 *                         example: 4
 *                       company_id:
 *                         type: integer
 *                         example: 1
 *                       unit_name:
 *                         type: string
 *                         example: Kilogram
 *                 message:
 *                   type: string
 *                   example: Units fetched successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthenticated user.
 *       403:
 *         description: Access to company denied.
 *       404:
 *         description: No units found for this company.
 */
router.get(
  "/:company_id",
  auth,
  validate(getUnitsSchema),
  company_access,
  getUnits
);

/**
 * @swagger
 * /api/v1/unit/{company_id}/{unit_id}:
 *   get:
 *     tags:
 *       - Units
 *     summary: Get a unit by ID
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Retrieves details of a specific measurement unit belonging to the company.
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
 *         name: unit_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 4
 *         description: Unique ID of the unit.
 *     responses:
 *       200:
 *         description: Unit fetched successfully.
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
 *                     unit_id:
 *                       type: integer
 *                       example: 4
 *                     company_id:
 *                       type: integer
 *                       example: 1
 *                     unit_name:
 *                       type: string
 *                       example: Kilogram
 *                 message:
 *                   type: string
 *                   example: Unit fetched successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthenticated user.
 *       403:
 *         description: Access to company denied.
 *       404:
 *         description: Unit not found.
 */
router.get(
  "/:company_id/:unit_id",
  auth,
  validate(unitIdParamsSchema),
  company_access,
  getOneUnit
);

/**
 * @swagger
 * /api/v1/unit/{company_id}/{unit_id}:
 *   patch:
 *     tags:
 *       - Units
 *     summary: Update a unit
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Updates the name of an existing measurement unit.
 *       The new name must not collide with any other unit in the same company.
 *
 *       ### Access requirements
 *       - **Authentication:** Required (`accessToken` cookie).
 *       - **Company access:** User must belong to `company_id`.
 *       - **Required role:** `owner` or `manager`.
 *
 *       ### Zod validation rules
 *       - `unit_name`: String, trimmed, 1 to 50 characters, required.
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *         description: Unique ID of the company.
 *       - in: path
 *         name: unit_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 4
 *         description: Unique ID of the unit to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - unit_name
 *             properties:
 *               unit_name:
 *                 type: string
 *                 example: Grams
 *                 description: Updated name for the measurement unit.
 *     responses:
 *       200:
 *         description: Unit updated successfully.
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
 *                     unit_id:
 *                       type: integer
 *                       example: 4
 *                     company_id:
 *                       type: integer
 *                       example: 1
 *                     unit_name:
 *                       type: string
 *                       example: Grams
 *                 message:
 *                   type: string
 *                   example: Unit updated successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Validation failed or missing unit_name.
 *       401:
 *         description: Unauthenticated user.
 *       403:
 *         description: Access denied or insufficient permissions.
 *       404:
 *         description: Unit not found.
 *       409:
 *         description: Unit with this name already exists in the company.
 */
router.patch(
  "/:company_id/:unit_id",
  auth,
  validate(updateUnitSchema),
  company_access,
  checkRole("owner", "manager"),
  updateUnit
);

export default router;
