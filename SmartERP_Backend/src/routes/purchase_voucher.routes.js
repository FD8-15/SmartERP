import { Router } from "express";
import { createVoucher, getAllVouchers, getOneVoucher, update } from "../controllers/purchase_voucher.controller.js";
import { checkRole } from "../middlewares/checkRole.middleware.js";
import { auth } from "../middlewares/jwt.js";
import { company_access } from "../middlewares/company_access.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    createPurchaseVoucherSchema,
    updatePurchaseVoucherSchema,
    getPurchaseVouchersSchema,
    purchaseVoucherIdParamsSchema
} from "../schemas/purchase_voucher.schema.js";

const router = Router();

/**
 * @swagger
 * /api/v1/purchase-voucher/{company_id}:
 *   post:
 *     tags:
 *       - Purchase Vouchers
 *     summary: Create a purchase voucher
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Records an inward stock purchase from a registered supplier.
 *       Executes in an atomic database transaction:
 *       1. Validates that supplier with \`gst_no\` exists in the company.
 *       2. Calculates each line item total (\`qty * item.default_purchase_price\`).
 *       3. Inserts voucher header with cumulative \`total_amt\`.
 *       4. Inserts line items into \`purchase_voucher_items\`.
 *       5. **Automated stock update:** Increments \`items.current_quantity\` by \`qty\` for each purchased item.
 *
 *       ### Access requirements
 *       - **Authentication:** Required (\`accessToken\` cookie).
 *       - **Company access:** User must belong to \`company_id\`.
 *       - **Required role:** \`owner\` or \`manager\`.
 *
 *       ### Zod validation rules
 *       - \`date\`: String in \`YYYY-MM-DD\` format.
 *       - \`gst_no\`: 15-character valid Indian GSTIN.
 *       - \`items\`: Non-empty array of objects with positive integer \`item_id\` and positive integer \`qty\`.
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
 *               - date
 *               - gst_no
 *               - items
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2026-09-28
 *                 description: Voucher date in YYYY-MM-DD format.
 *               gst_no:
 *                 type: string
 *                 example: 27ABCDE1234F1Z5
 *                 description: 15-character GST number of the supplier.
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - item_id
 *                     - qty
 *                   properties:
 *                     item_id:
 *                       type: integer
 *                       example: 10
 *                     qty:
 *                       type: integer
 *                       example: 5
 *     responses:
 *       201:
 *         description: Purchase voucher created and inventory stock incremented.
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
 *                     voucher:
 *                       type: object
 *                       properties:
 *                         voucher_id:
 *                           type: integer
 *                           example: 101
 *                         company_id:
 *                           type: integer
 *                           example: 1
 *                         supplier_id:
 *                           type: integer
 *                           example: 8
 *                         date:
 *                           type: string
 *                           example: "2026-09-27T18:30:00.000Z"
 *                         total_amt:
 *                           type: string
 *                           example: "225000.00"
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           voucher_item_id:
 *                             type: integer
 *                             example: 205
 *                           voucher_id:
 *                             type: integer
 *                             example: 101
 *                           item_id:
 *                             type: integer
 *                             example: 10
 *                           qty:
 *                             type: integer
 *                             example: 5
 *                           total_amt:
 *                             type: string
 *                             example: "225000.00"
 *                 message:
 *                   type: string
 *                   example: Purchase voucher created successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Supplier not found, item not found, invalid quantity, or validation failed.
 *       401:
 *         description: Unauthenticated user.
 *       403:
 *         description: Access denied or insufficient role.
 */
router.post(
    "/:company_id",
    auth,
    validate(createPurchaseVoucherSchema),
    company_access,
    checkRole("owner", "manager"),
    createVoucher
);

/**
 * @swagger
 * /api/v1/purchase-voucher/{company_id}:
 *   get:
 *     tags:
 *       - Purchase Vouchers
 *     summary: List purchase vouchers
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Retrieves purchase vouchers for the company with optional ILIKE search filter on \`supplier_id\`
 *       and pagination parameters. Ordered by \`voucher_id ASC\`.
 *
 *       ### Access requirements
 *       - **Authentication:** Required (\`accessToken\` cookie).
 *       - **Company access:** User must belong to \`company_id\`.
 *       - **Required role:** Any member (\`owner\`, \`manager\`, or \`employee\`).
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
 *         example: "8"
 *         description: Filter vouchers by supplier ID (ILIKE on supplier_id::text).
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
 *         description: Purchase vouchers retrieved successfully.
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
 *                     AllVouchers:
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
 *                   example: Success
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
    validate(getPurchaseVouchersSchema),
    company_access,
    getAllVouchers
);

/**
 * @swagger
 * /api/v1/purchase-voucher/{company_id}/{voucher_id}:
 *   get:
 *     tags:
 *       - Purchase Vouchers
 *     summary: Get purchase voucher with line items
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Retrieves a purchase voucher along with all its line items joined from \`purchase_voucher_items\`.
 *
 *       ### Access requirements
 *       - **Authentication:** Required (\`accessToken\` cookie).
 *       - **Company access:** User must belong to \`company_id\`.
 *       - **Required role:** Any member (\`owner\`, \`manager\`, or \`employee\`).
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *         description: Unique ID of the company.
 *       - in: path
 *         name: voucher_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 101
 *         description: Unique ID of the purchase voucher.
 *     responses:
 *       200:
 *         description: Purchase voucher fetched successfully.
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
 *                     Voucher:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           voucher_id:
 *                             type: integer
 *                             example: 101
 *                           company_id:
 *                             type: integer
 *                             example: 1
 *                           supplier_id:
 *                             type: integer
 *                             example: 8
 *                           date:
 *                             type: string
 *                             example: "2026-09-27T18:30:00.000Z"
 *                           voucher_total_amt:
 *                             type: string
 *                             example: "225000.00"
 *                           voucher_item_id:
 *                             type: integer
 *                             example: 205
 *                           item_id:
 *                             type: integer
 *                             example: 10
 *                           qty:
 *                             type: integer
 *                             example: 5
 *                           line_total_amt:
 *                             type: string
 *                             example: "225000.00"
 *                 message:
 *                   type: string
 *                   example: Success
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Voucher not found.
 *       401:
 *         description: Unauthenticated user.
 *       403:
 *         description: Access to company denied.
 */
router.get(
    "/:company_id/:voucher_id",
    auth,
    validate(purchaseVoucherIdParamsSchema),
    company_access,
    getOneVoucher
);

/**
 * @swagger
 * /api/v1/purchase-voucher/{company_id}/{voucher_id}:
 *   patch:
 *     tags:
 *       - Purchase Vouchers
 *     summary: Update purchase voucher line items
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Updates the items in an existing purchase voucher and recalculates inventory quantities:
 *       - For modified items: adjusts inventory by \`(newQty - oldQty)\`.
 *       - For newly added items: increments inventory by \`newQty\`.
 *       - For removed items: decrements inventory by \`oldQty\`.
 *       - Recalculates voucher \`total_amt\` within an atomic transaction.
 *
 *       ### Access requirements
 *       - **Authentication:** Required (\`accessToken\` cookie).
 *       - **Company access:** User must belong to \`company_id\`.
 *       - **Required role:** \`owner\` or \`manager\`.
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *         description: Unique ID of the company.
 *       - in: path
 *         name: voucher_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 101
 *         description: Unique ID of the purchase voucher to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - item_id
 *                     - qty
 *                   properties:
 *                     item_id:
 *                       type: integer
 *                       example: 10
 *                     qty:
 *                       type: integer
 *                       example: 8
 *     responses:
 *       200:
 *         description: Purchase voucher updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: success
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Voucher not found or validation failed.
 *       401:
 *         description: Unauthenticated user.
 *       403:
 *         description: Access denied or insufficient permissions.
 */
router.patch(
    "/:company_id/:voucher_id",
    auth,
    validate(updatePurchaseVoucherSchema),
    company_access,
    checkRole("owner", "manager"),
    update
);

export default router;
