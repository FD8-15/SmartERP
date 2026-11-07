import { Router } from "express";
import { createReceipt, getAllReceiptsBySalesVoucher, getAllVouchers, getOneVoucher, update } from "../controllers/receipt.controller.js";
import { auth } from "../middlewares/jwt.js";
import { checkRole } from "../middlewares/checkRole.middleware.js";
import { company_access } from "../middlewares/company_access.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    createReceiptVoucherSchema,
    updateReceiptVoucherSchema,
    getAllReceiptVouchersSchema,
    getOneReceiptVoucherSchema,
    getReceiptsBySalesVoucherSchema
} from "../schemas/receipt_voucher.schema.js";

const router = Router();

/**
 * @swagger
 * /api/v1/receipt-voucher/{company_id}/{sales_id}:
 *   post:
 *     tags:
 *       - Receipt Vouchers
 *     summary: Create a receipt voucher
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Records a payment collection from a customer against an existing sales voucher.
 *       Enforces outstanding balance check: cumulative collections cannot exceed the sales voucher's \`total_amt\`.
 *       Throws \`400 cannot pay more then remaining amount\` if the collected amount exceeds the outstanding balance.
 *
 *       ### Access requirements
 *       - **Authentication:** Required (\`accessToken\` cookie).
 *       - **Company access:** User must belong to \`company_id\`.
 *       - **Required role:** \`owner\` or \`manager\`.
 *
 *       ### Zod validation rules
 *       - \`connect_no\`: 10-digit Indian mobile number of the customer (\`^[6-9]\d{9}$\`).
 *       - \`current_amt_paid\`: Positive number (> 0), required.
 *       - \`date\`: String in \`YYYY-MM-DD\` format.
 *       - \`mode\`: String, non-empty (e.g., "cash", "upi", "cheque", "bank_transfer").
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - connect_no
 *               - current_amt_paid
 *               - date
 *               - mode
 *             properties:
 *               connect_no:
 *                 type: string
 *                 example: "9823012345"
 *                 description: Customer mobile contact number.
 *               current_amt_paid:
 *                 type: number
 *                 example: 30000
 *                 description: Amount collected from customer.
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2026-09-28
 *                 description: Collection date in YYYY-MM-DD format.
 *               mode:
 *                 type: string
 *                 example: upi
 *                 description: Payment mode (cash, upi, bank_transfer, etc.).
 *     responses:
 *       201:
 *         description: Receipt voucher created successfully.
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
 *                         receipt_id:
 *                           type: integer
 *                           example: 45
 *                         company_id:
 *                           type: integer
 *                           example: 1
 *                         customer_id:
 *                           type: integer
 *                           example: 12
 *                         sales_id:
 *                           type: integer
 *                           example: 201
 *                         amount_paid:
 *                           type: string
 *                           example: "30000"
 *                         date:
 *                           type: string
 *                           example: "2026-09-27T18:30:00.000Z"
 *                         mode:
 *                           type: string
 *                           example: upi
 *                 message:
 *                   type: string
 *                   example: Success
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Customer not found, payment exceeds remaining balance, or validation failed.
 *       401:
 *         description: Unauthenticated user.
 *       403:
 *         description: Access denied or insufficient permissions.
 *       404:
 *         description: Sales voucher not found.
 */
router.post("/:company_id/:sales_id", auth, validate(createReceiptVoucherSchema), company_access, checkRole("owner", "manager"), createReceipt);

/**
 * @swagger
 * /api/v1/receipt-voucher/{company_id}/{sales_id}/{receipt_id}:
 *   patch:
 *     tags:
 *       - Receipt Vouchers
 *     summary: Update receipt voucher
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Updates the payment amount or customer contact on an existing receipt voucher.
 *       Recalculates outstanding balance of the sales voucher excluding this receipt.
 *       Throws \`400 cannot pay more then remaining amount\` if \`current_amt_paid > remaining\`.
 *
 *       ### Access requirements
 *       - **Authentication:** Required (\`accessToken\` cookie).
 *       - **Company access:** User must belong to \`company_id\`.
 *       - **Required role:** \`owner\` or \`manager\`.
 *
 *       ### Zod validation rules
 *       - \`connect_no\`: 10-digit Indian mobile number (\`^[6-9]\d{9}$\`).
 *       - \`current_amt_paid\`: Positive number (> 0), required.
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: path
 *         name: sales_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 201
 *       - in: path
 *         name: receipt_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 45
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - connect_no
 *               - current_amt_paid
 *             properties:
 *               connect_no:
 *                 type: string
 *                 example: "9823012345"
 *               current_amt_paid:
 *                 type: number
 *                 example: 35000
 *     responses:
 *       200:
 *         description: Receipt voucher updated successfully.
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
 *                     voucher:
 *                       type: object
 *                       properties:
 *                         receipt_id:
 *                           type: integer
 *                           example: 45
 *                         amount_paid:
 *                           type: string
 *                           example: "35000"
 *                 message:
 *                   type: string
 *                   example: Success
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Customer not found, payment exceeds remaining balance, or validation failed.
 *       401:
 *         description: Unauthenticated user.
 *       403:
 *         description: Access denied or insufficient permissions.
 *       404:
 *         description: Sales voucher or receipt not found.
 */
router.patch("/:company_id/:sales_id/:receipt_id", auth, validate(updateReceiptVoucherSchema), company_access, checkRole("owner", "manager"), update);

/**
 * @swagger
 * /api/v1/receipt-voucher/{company_id}:
 *   get:
 *     tags:
 *       - Receipt Vouchers
 *     summary: List all receipt vouchers for company
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Retrieves all receipt vouchers recorded for the company.
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
 *     responses:
 *       200:
 *         description: Receipt vouchers retrieved successfully.
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
 *                     receipt_voucher:
 *                       type: array
 *                       items:
 *                         type: object
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
 *       404:
 *         description: Vouchers not found.
 */
router.get("/:company_id", auth, validate(getAllReceiptVouchersSchema), company_access, getAllVouchers);

/**
 * @swagger
 * /api/v1/receipt-voucher/{company_id}/{receipt_id}:
 *   get:
 *     tags:
 *       - Receipt Vouchers
 *     summary: Get receipt voucher by ID
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Retrieves details for a single receipt voucher.
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
 *       - in: path
 *         name: receipt_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 45
 *     responses:
 *       200:
 *         description: Receipt voucher retrieved successfully.
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
 *                     receipt_voucher:
 *                       type: object
 *                       properties:
 *                         receipt_id:
 *                           type: integer
 *                           example: 45
 *                         company_id:
 *                           type: integer
 *                           example: 1
 *                         amount_paid:
 *                           type: string
 *                           example: "30000"
 *                         date:
 *                           type: string
 *                           example: "2026-09-27T18:30:00.000Z"
 *                         mode:
 *                           type: string
 *                           example: upi
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
 *       404:
 *         description: Voucher not found.
 */
router.get("/:company_id/:receipt_id", auth, validate(getOneReceiptVoucherSchema), company_access, getOneVoucher);

/**
 * @swagger
 * /api/v1/receipt-voucher/{company_id}/{sales_id}/{customer_id}:
 *   get:
 *     tags:
 *       - Receipt Vouchers
 *     summary: Get all receipts for a sales voucher
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Retrieves all receipt vouchers recorded against a specific sales voucher and customer,
 *       with optional pagination parameters. Ordered by \`receipt_id ASC\`.
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
 *       - in: path
 *         name: sales_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 201
 *       - in: path
 *         name: customer_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 12
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         example: 10
 *     responses:
 *       200:
 *         description: Receipts retrieved successfully.
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
 *                     receipt_voucher:
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
router.get("/:company_id/:sales_id/:customer_id", auth, validate(getReceiptsBySalesVoucherSchema), company_access, getAllReceiptsBySalesVoucher);

export default router;
