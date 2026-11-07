import { Router } from "express";
import { createItem, getItems, getOneItem, update } from "../controllers/item.controller.js";
import { auth } from "../middlewares/jwt.js";
import { company_access } from "../middlewares/company_access.middleware.js";
import { checkRole } from "../middlewares/checkRole.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createItemSchema, updateItemSchema } from "../schemas/item.schema.js";

const router = Router();

/**
 * @swagger
 * /api/v1/item/{company_id}:
 *   post:
 *     tags:
 *       - Items
 *     summary: Create an inventory item
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Creates a new product/item in the company's inventory catalog.
 *       SKU must be unique within the company. `category_id` and `unit_id` must belong to the same company.
 *
 *       ### Access requirements
 *       - **Authentication:** Required (`accessToken` cookie).
 *       - **Company access:** User must belong to `company_id`.
 *       - **Required role:** `owner` or `manager`.
 *
 *       ### Zod validation rules
 *       - `item_name`: String, trimmed, min 2 characters.
 *       - `sku`: String, trimmed, min 1 character, unique within company.
 *       - `brand`: String, trimmed, min 1 character.
 *       - `category_id`: Positive integer, must exist in company.
 *       - `unit_id`: Positive integer, must exist in company.
 *       - `gst_percentage`: Number, >= 0 (e.g. 18).
 *       - `default_purchase_price`: Number, >= 0.
 *       - `default_selling_price`: Number, >= 0.
 *       - `current_quantity`: Number, >= 0 (initial stock on creation).
 *       - `status`: String, trimmed, min 1 character (e.g. "active").
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
 *               - item_name
 *               - sku
 *               - brand
 *               - category_id
 *               - unit_id
 *               - gst_percentage
 *               - default_purchase_price
 *               - default_selling_price
 *               - current_quantity
 *               - status
 *             properties:
 *               item_name:
 *                 type: string
 *                 example: HP Laptop 15s
 *               sku:
 *                 type: string
 *                 example: HP-LAP-15S
 *               brand:
 *                 type: string
 *                 example: HP
 *               category_id:
 *                 type: integer
 *                 example: 5
 *               unit_id:
 *                 type: integer
 *                 example: 4
 *               gst_percentage:
 *                 type: number
 *                 example: 18
 *               default_purchase_price:
 *                 type: number
 *                 example: 45000
 *               default_selling_price:
 *                 type: number
 *                 example: 55000
 *               current_quantity:
 *                 type: number
 *                 example: 25
 *               status:
 *                 type: string
 *                 example: active
 *     responses:
 *       201:
 *         description: Item created successfully.
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
 *                         item_id:
 *                           type: integer
 *                           example: 10
 *                         company_id:
 *                           type: integer
 *                           example: 1
 *                         item_name:
 *                           type: string
 *                           example: HP Laptop 15s
 *                         sku:
 *                           type: string
 *                           example: HP-LAP-15S
 *                         brand:
 *                           type: string
 *                           example: HP
 *                         category_id:
 *                           type: integer
 *                           example: 5
 *                         unit_id:
 *                           type: integer
 *                           example: 4
 *                         gst_percentage:
 *                           type: string
 *                           example: "18"
 *                         default_purchase_price:
 *                           type: string
 *                           example: "45000"
 *                         default_selling_price:
 *                           type: string
 *                           example: "55000"
 *                         current_quantity:
 *                           type: number
 *                           example: 25
 *                         status:
 *                           type: string
 *                           example: active
 *                 message:
 *                   type: string
 *                   example: item created successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Validation failed or category/unit does not exist in company.
 *       401:
 *         description: Unauthenticated user.
 *       403:
 *         description: Access denied or insufficient role.
 *       409:
 *         description: SKU already exists in this company.
 */
router.post("/:company_id", auth, validate(createItemSchema), company_access, checkRole("owner", "manager"), createItem);

/**
 * @swagger
 * /api/v1/item/{company_id}:
 *   get:
 *     tags:
 *       - Items
 *     summary: List items with search and pagination
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Retrieves inventory items for the company with optional ILIKE search filter on `item_name`
 *       and pagination parameters. Ordered by `item_id ASC`.
 *
 *       ### Access requirements
 *       - **Authentication:** Required (`accessToken` cookie).
 *       - **Company access:** User must belong to `company_id`.
 *       - **Required role:** Any company member (`owner`, `manager`, or `employee`).
 *
 *       ### Pagination defaults
 *       - `page`: Default is `1` (minimum `1`).
 *       - `limit`: Default is `10` (minimum `1`, maximum `100`).
 *       - Offset is calculated as `(page - 1) * limit`.
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
 *         example: Laptop
 *         description: Case-insensitive search pattern on item_name (ILIKE %search%).
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         example: 1
 *         description: Page number (1-based).
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         example: 10
 *         description: Maximum records per page (up to 100).
 *     responses:
 *       200:
 *         description: Items fetched successfully.
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
 *                     items:
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
 *                   example: Items fetched successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthenticated user.
 *       403:
 *         description: Access to company denied.
 *       404:
 *         description: No items found matching the query.
 */
router.get("/:company_id", auth, company_access, getItems);

/**
 * @swagger
 * /api/v1/item/{company_id}/{item_id}:
 *   get:
 *     tags:
 *       - Items
 *     summary: Get item details by ID
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Retrieves full catalog details and current inventory quantity for a single item.
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
 *         name: item_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 10
 *         description: Unique ID of the item.
 *     responses:
 *       200:
 *         description: Item fetched successfully.
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
 *                     item_id:
 *                       type: integer
 *                       example: 10
 *                     company_id:
 *                       type: integer
 *                       example: 1
 *                     item_name:
 *                       type: string
 *                       example: HP Laptop 15s
 *                     sku:
 *                       type: string
 *                       example: HP-LAP-15S
 *                     brand:
 *                       type: string
 *                       example: HP
 *                     category_id:
 *                       type: integer
 *                       example: 5
 *                     unit_id:
 *                       type: integer
 *                       example: 4
 *                     gst_percentage:
 *                       type: string
 *                       example: "18"
 *                     default_purchase_price:
 *                       type: string
 *                       example: "45000"
 *                     default_selling_price:
 *                       type: string
 *                       example: "55000"
 *                     current_quantity:
 *                       type: number
 *                       example: 25
 *                     status:
 *                       type: string
 *                       example: active
 *                 message:
 *                   type: string
 *                   example: Item fetched successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthenticated user.
 *       403:
 *         description: Access to company denied.
 *       404:
 *         description: Item not found.
 */
router.get("/:company_id/:item_id", auth, company_access, getOneItem);

/**
 * @swagger
 * /api/v1/item/{company_id}/{item_id}:
 *   patch:
 *     tags:
 *       - Items
 *     summary: Update an item
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Updates product information, prices, and status.
 *
 *       **Note on inventory:** \`current_quantity\` is intentionally omitted from this update schema;
 *       stock levels are adjusted solely via Purchase and Sales vouchers.
 *
 *       ### Access requirements
 *       - **Authentication:** Required (`accessToken` cookie).
 *       - **Company access:** User must belong to `company_id`.
 *       - **Required role:** `owner` or `manager`.
 *
 *       ### Zod validation rules
 *       - Same field rules as creation (except current_quantity).
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *         description: Unique ID of the company.
 *       - in: path
 *         name: item_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 10
 *         description: Unique ID of the item to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - item_name
 *               - sku
 *               - brand
 *               - category_id
 *               - unit_id
 *               - gst_percentage
 *               - default_purchase_price
 *               - default_selling_price
 *               - status
 *             properties:
 *               item_name:
 *                 type: string
 *                 example: HP Laptop 15s Pro
 *               sku:
 *                 type: string
 *                 example: HP-LAP-15S-PRO
 *               brand:
 *                 type: string
 *                 example: HP
 *               category_id:
 *                 type: integer
 *                 example: 5
 *               unit_id:
 *                 type: integer
 *                 example: 4
 *               gst_percentage:
 *                 type: number
 *                 example: 18
 *               default_purchase_price:
 *                 type: number
 *                 example: 48000
 *               default_selling_price:
 *                 type: number
 *                 example: 58000
 *               status:
 *                 type: string
 *                 example: active
 *     responses:
 *       200:
 *         description: Item updated successfully.
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
 *                     item_id:
 *                       type: integer
 *                       example: 10
 *                     item_name:
 *                       type: string
 *                       example: HP Laptop 15s Pro
 *                     sku:
 *                       type: string
 *                       example: HP-LAP-15S-PRO
 *                 message:
 *                   type: string
 *                   example: Update successful
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Validation failed or category/unit does not exist in company.
 *       401:
 *         description: Unauthenticated user.
 *       403:
 *         description: Access denied or insufficient permissions.
 *       404:
 *         description: Item not found.
 *       409:
 *         description: SKU already exists in this company.
 */
router.patch("/:company_id/:item_id", auth, validate(updateItemSchema), company_access, checkRole("owner", "manager"), update);

export default router;
