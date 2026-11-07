import { Router } from "express";
import { createPaymentVoucher, getOneVoucher, getAllPaymentsByPurchaseVoucher, getAllVouchers, update } from "../controllers/payment_voucher.controller.js";
import { checkRole } from "../middlewares/checkRole.middleware.js";
import { auth } from "../middlewares/jwt.js";
import { company_access } from "../middlewares/company_access.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    createPaymentVoucherSchema,
    updatePaymentVoucherSchema,
    getOnePaymentVoucherSchema,
    getPaymentsByPurchaseVoucherSchema,
    getAllPaymentVouchersSchema
} from "../schemas/payment_voucher.schema.js";

const router = Router();

/**
 * @swagger
 * /api/v1/payment-voucher/{company_id}/{voucher_id}/{supplier_id}:
 *   post:
 *     tags:
 *       - Payment Vouchers
 *     summary: Create a payment voucher
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Records a payment made to a supplier against an existing purchase voucher.
 *       Enforces outstanding balance check: cumulative payments cannot exceed the purchase voucher's \`total_amt\`.
 *       Throws \`400 Cannot pay more than outstanding amount\` if the payment exceeds the remaining balance.
 *
 *       ### Access requirements
 *       - **Authentication:** Required (\`accessToken\` cookie).
 *       - **Company access:** User must belong to \`company_id\`.
 *       - **Required role:** \`owner\` or \`manager\`.
 *
 *       ### Zod validation rules
 *       - \`paid_amt\`: Number, positive (> 0), required.
 *       - \`date\`: String in \`YYYY-MM-DD\` format.
 *       - \`mode\`: String, non-empty (e.g., "cash", "bank_transfer", "cheque").
 *       - Route parameters: \`company_id\`, \`voucher_id\`, \`supplier_id\` must be positive integers.
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
 *         description: Unique ID of the purchase voucher being paid.
 *       - in: path
 *         name: supplier_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 8
 *         description: Unique ID of the supplier receiving the payment.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paid_amt
 *               - date
 *               - mode
 *             properties:
 *               paid_amt:
 *                 type: number
 *                 example: 50000
 *                 description: Amount paid to the supplier.
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2026-09-28
 *                 description: Payment date in YYYY-MM-DD format.
 *               mode:
 *                 type: string
 *                 example: bank_transfer
 *                 description: Payment mode (cash, bank_transfer, cheque, etc.).
 *     responses:
 *       201:
 *         description: Payment voucher created successfully.
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
 *                         payment_id:
 *                           type: integer
 *                           example: 50
 *                         company_id:
 *                           type: integer
 *                           example: 1
 *                         supplier_id:
 *                           type: integer
 *                           example: 8
 *                         voucher_id:
 *                           type: integer
 *                           example: 101
 *                         amount_paid:
 *                           type: string
 *                           example: "50000.00"
 *                         date:
 *                           type: string
 *                           example: "2026-09-27T18:30:00.000Z"
 *                         mode:
 *                           type: string
 *                           example: bank_transfer
 *                 message:
 *                   type: string
 *                   example: Payment voucher created successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Purchase voucher not found, payment exceeds outstanding amount, or validation failed.
 *       401:
 *         description: Unauthenticated user.
 *       403:
 *         description: Access denied or insufficient role.
 */
router.post("/:company_id/:voucher_id/:supplier_id", auth, validate(createPaymentVoucherSchema), company_access, checkRole("owner", "manager"), createPaymentVoucher);

/**
 * @swagger
 * /api/v1/payment-voucher/{company_id}/{voucher_id}/{supplier_id}/{payment_id}:
 *   get:
 *     tags:
 *       - Payment Vouchers
 *     summary: Get a specific payment voucher
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Retrieves details of a single payment voucher verified by company, purchase voucher, and supplier IDs.
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
 *         name: voucher_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 101
 *       - in: path
 *         name: supplier_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 8
 *       - in: path
 *         name: payment_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 50
 *     responses:
 *       200:
 *         description: Payment voucher fetched successfully.
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
 *                         payment_id:
 *                           type: integer
 *                           example: 50
 *                         amount_paid:
 *                           type: string
 *                           example: "50000.00"
 *                         mode:
 *                           type: string
 *                           example: bank_transfer
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
router.get("/:company_id/:voucher_id/:supplier_id/:payment_id", auth, validate(getOnePaymentVoucherSchema), company_access, getOneVoucher);

/**
 * @swagger
 * /api/v1/payment-voucher/{company_id}/{voucher_id}/{supplier_id}:
 *   get:
 *     tags:
 *       - Payment Vouchers
 *     summary: Get all payments for a purchase voucher
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Retrieves all payment vouchers made towards a specific purchase voucher.
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
 *         name: voucher_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 101
 *       - in: path
 *         name: supplier_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 8
 *     responses:
 *       200:
 *         description: Payments retrieved successfully.
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
router.get("/:company_id/:voucher_id/:supplier_id", auth, validate(getPaymentsByPurchaseVoucherSchema), company_access, getAllPaymentsByPurchaseVoucher);

/**
 * @swagger
 * /api/v1/payment-voucher/{company_id}:
 *   get:
 *     tags:
 *       - Payment Vouchers
 *     summary: List all payment vouchers for company
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Retrieves all payment vouchers for the company with optional ILIKE search filter on \`voucher_id\`
 *       and pagination parameters. Ordered by \`payment_id ASC\`.
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         example: "101"
 *         description: Filter payment vouchers by purchase voucher ID.
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
 *         description: Payment vouchers retrieved successfully.
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
 *                   example: Vouchers fetched successfully
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
router.get("/:company_id", auth, validate(getAllPaymentVouchersSchema), company_access, getAllVouchers);

/**
 * @swagger
 * /api/v1/payment-voucher/{company_id}/{voucher_id}/{supplier_id}/{payment_id}:
 *   patch:
 *     tags:
 *       - Payment Vouchers
 *     summary: Update payment voucher amount
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Updates the payment amount of an existing payment voucher.
 *       Recalculates the outstanding balance of the purchase voucher excluding this payment:
 *       \`remaining = total_amt - sum(other payments)\`.
 *       Throws \`400 Cannot pay more than outstanding amount\` if \`amtNew > remaining\`.
 *
 *       ### Access requirements
 *       - **Authentication:** Required (\`accessToken\` cookie).
 *       - **Company access:** User must belong to \`company_id\`.
 *       - **Required role:** \`owner\` or \`manager\`.
 *
 *       ### Zod validation rules
 *       - \`amtNew\`: Positive number (> 0), required.
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: path
 *         name: voucher_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 101
 *       - in: path
 *         name: supplier_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 8
 *       - in: path
 *         name: payment_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 50
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amtNew
 *             properties:
 *               amtNew:
 *                 type: number
 *                 example: 60000
 *                 description: New payment amount.
 *     responses:
 *       200:
 *         description: Payment voucher updated successfully.
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
 *                         payment_id:
 *                           type: integer
 *                           example: 50
 *                         amount_paid:
 *                           type: string
 *                           example: "60000.00"
 *                 message:
 *                   type: string
 *                   example: Success
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Payment exceeds remaining balance or validation failed.
 *       401:
 *         description: Unauthenticated user.
 *       403:
 *         description: Access denied or insufficient permissions.
 *       404:
 *         description: Payment or purchase voucher not found.
 */
router.patch("/:company_id/:voucher_id/:supplier_id/:payment_id", auth, validate(updatePaymentVoucherSchema), company_access, checkRole("owner", "manager"), update);

export default router;
