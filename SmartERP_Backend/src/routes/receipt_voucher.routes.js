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

router.post("/:company_id/:sales_id", auth, validate(createReceiptVoucherSchema), company_access, checkRole("owner", "manager"), createReceipt);

router.patch("/:company_id/:sales_id/:receipt_id", auth, validate(updateReceiptVoucherSchema), company_access, checkRole("owner", "manager"), update);

router.get("/:company_id", auth, validate(getAllReceiptVouchersSchema), company_access, getAllVouchers);

router.get("/:company_id/:receipt_id", auth, validate(getOneReceiptVoucherSchema), company_access, getOneVoucher);

router.get("/:company_id/:sales_id/:customer_id", auth, validate(getReceiptsBySalesVoucherSchema), company_access, getAllReceiptsBySalesVoucher);

export default router;
