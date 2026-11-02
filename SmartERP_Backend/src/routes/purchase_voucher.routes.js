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

router.post(
    "/:company_id",
    auth,
    validate(createPurchaseVoucherSchema),
    company_access,
    checkRole("owner", "manager"),
    createVoucher
);

router.get(
    "/:company_id",
    auth,
    validate(getPurchaseVouchersSchema),
    company_access,
    getAllVouchers
);

router.get(
    "/:company_id/:voucher_id",
    auth,
    validate(purchaseVoucherIdParamsSchema),
    company_access,
    getOneVoucher
);

router.patch(
    "/:company_id/:voucher_id",
    auth,
    validate(updatePurchaseVoucherSchema),
    company_access,
    checkRole("owner", "manager"),
    update
);

export default router;
