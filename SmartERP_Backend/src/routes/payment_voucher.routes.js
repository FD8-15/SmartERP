import { Router } from "express";
import { createPaymentVoucher, getOneVoucher, getAllPaymentsByPurchaseVoucher, getAllVouchers, update } from "../controllers/payment_voucher.controller.js";
import { checkRole } from "../middlewares/checkRole.middleware.js";
import { auth } from "../middlewares/jwt.js";
import { company_access } from "../middlewares/company_access.middleware.js";

const router = Router();

router.post("/:company_id/:voucher_id/:supplier_id", auth, company_access, checkRole("owner", "manager"), createPaymentVoucher);
router.get("/:company_id/:voucher_id/:supplier_id/:payment_id", auth, company_access, getOneVoucher);
router.get("/:company_id/:voucher_id/:supplier_id", auth, company_access, getAllPaymentsByPurchaseVoucher);
router.get("/:company_id", auth, company_access, getAllVouchers);
router.patch("/:company_id/:voucher_id/:supplier_id/:payment_id", auth, company_access, checkRole("owner", "manager"), update);

export default router;