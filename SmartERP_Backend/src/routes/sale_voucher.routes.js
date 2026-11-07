import { Router } from "express";
import { createVoucher, getAllVouchers, getOneVoucher, update } from "../controllers/sale _voucher.controller.js";
import { auth } from "../middlewares/jwt.js";
import { company_access } from "../middlewares/company_access.middleware.js";
import { checkRole } from "../middlewares/checkRole.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    createSaleVoucherSchema,
    updateSaleVoucherSchema,
    getSaleVouchersSchema,
    saleVoucherIdParamsSchema
} from "../schemas/sale_voucher.schema.js";

const router = Router();

/**
 * @swagger
 * /api/v1/sales-voucher/{company_id}/{customer_id}/{contact_no}:
 *   post:
 *     tags:
 *       - Sales Vouchers
 *     summary: Create a sales voucher
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Records an outward sales bill to a registered customer.
 *       Executes in an atomic database transaction:
 *       1. Validates that customer with \`contact_no\` exists in the company.
 *       2. Checks stock sufficiency: verifies \`qty <= current_quantity\` for every item. Throws \`400 cannot sell more then current quantity\` if stock is insufficient.
 *       3. Calculates line totals (\`qty * item.default_selling_price\`) and voucher \`total_amt\`.
 *       4. Inserts sales voucher header.
 *       5. Inserts line items into \`sales_voucher_items\`.
 *       6. **Automated stock deduction:** Decrements \`items.current_quantity\` by \`qty\` for each sold item.
 *
 *       ### Access requirements
 *       - **Authentication:** Required (\`accessToken\` cookie).
 *       - **Company access:** User must belong to \`company_id\`.
 *       - **Required role:** \`owner\` or \`manager\`.
 *
 *       ### Zod validation rules
 *       - \`date\`: String in \`YYYY-MM-DD\` format.
 *       - \`items\`: Non-empty array of objects with positive integer \`item_id\` and positive integer \`qty\`.
 *       - \`company_id\`: Positive integer path parameter.
 *       - \`customer_id\`: Positive integer path parameter.
 *       - \`contact_no\`: 10-digit Indian mobile number path parameter (\`^[6-9]\d{9}$\`).
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
 *       - in: path
 *         name: contact_no
 *         required: true
 *         schema:
 *           type: string
 *         example: "9823012345"
 *         description: 10-digit mobile number of the customer.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - items
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2026-09-28
 *                 description: Voucher date in YYYY-MM-DD format.
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
 *                       example: 2
 *     responses:
 *       201:
 *         description: Sales voucher created and inventory stock decremented.
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
 *                     Voucher:
 *                       type: object
 *                       properties:
 *                         sales_id:
 *                           type: integer
 *                           example: 201
 *                         company_id:
 *                           type: integer
 *                           example: 1
 *                         customer_id:
 *                           type: integer
 *                           example: 12
 *                         total_amt:
 *                           type: string
 *                           example: "110000.00"
 *                         date:
 *                           type: string
 *                           example: "2026-09-27T18:30:00.000Z"
 *                 message:
 *                   type: string
 *                   example: Sales voucher created successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Customer not found, item not found, insufficient stock, or validation failed.
 *       401:
 *         description: Unauthenticated user.
 *       403:
 *         description: Access denied or insufficient role.
 */
router.post(
    "/:company_id/:customer_id/:contact_no",
    auth,
    validate(createSaleVoucherSchema),
    company_access,
    checkRole("owner", "manager"),
    createVoucher
);

/**
 * @swagger
 * /api/v1/sales-voucher/{company_id}:
 *   get:
 *     tags:
 *       - Sales Vouchers
 *     summary: List sales vouchers
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Retrieves sales vouchers for the company with optional ILIKE search filter on \`customer_id\`
 *       and pagination parameters. Ordered by \`sales_id ASC\`.
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
 *         example: "12"
 *         description: Filter vouchers by customer ID (ILIKE on customer_id::text).
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
 *         description: Sales vouchers retrieved successfully.
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
 *                     Vouchers:
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
 *                   example: All vouchers fetched successfully
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
    validate(getSaleVouchersSchema),
    company_access,
    getAllVouchers
);

/**
 * @swagger
 * /api/v1/sales-voucher/{company_id}/{sales_id}:
 *   get:
 *     tags:
 *       - Sales Vouchers
 *     summary: Get sales voucher with line items
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Retrieves a sales voucher with its itemized lines nested in an \`items\` array.
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
 *         name: sales_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 201
 *         description: Unique ID of the sales voucher.
 *     responses:
 *       200:
 *         description: Sales voucher fetched successfully.
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
 *                     Vouchers:
 *                       type: object
 *                       properties:
 *                         sales_id:
 *                           type: integer
 *                           example: 201
 *                         company_id:
 *                           type: integer
 *                           example: 1
 *                         customer_id:
 *                           type: integer
 *                           example: 12
 *                         voucher_total_amt:
 *                           type: string
 *                           example: "110000.00"
 *                         date:
 *                           type: string
 *                           example: "2026-09-27T18:30:00.000Z"
 *                         items:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               sales_items_id:
 *                                 type: integer
 *                                 example: 301
 *                               item_id:
 *                                 type: integer
 *                                 example: 10
 *                               qty:
 *                                 type: integer
 *                                 example: 2
 *                               line_total_amt:
 *                                 type: string
 *                                 example: "110000.00"
 *                 message:
 *                   type: string
 *                   example: Voucher fetched successfully
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
    "/:company_id/:sales_id",
    auth,
    validate(saleVoucherIdParamsSchema),
    company_access,
    getOneVoucher
);

/**
 * @swagger
 * /api/v1/sales-voucher/{company_id}/{sales_id}:
 *   patch:
 *     tags:
 *       - Sales Vouchers
 *     summary: Update sales voucher line items
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Updates the line items of an existing sales voucher and adjusts inventory:
 *       - Sales quantity increases deduct inventory; decreases restore inventory.
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
 *         name: sales_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 201
 *         description: Unique ID of the sales voucher to update.
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
 *                       example: 3
 *     responses:
 *       200:
 *         description: Sales voucher updated successfully.
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
    "/:company_id/:sales_id",
    auth,
    validate(updateSaleVoucherSchema),
    company_access,
    checkRole("owner", "manager"),
    update
);

export default router;
