import { Router } from "express";
import { createVoucher, getAllVouchers, getOneVoucher, update } from "../controllers/purchase_voucher.controller.js";
import { checkRole } from "../middlewares/checkRole.middleware.js";
import { auth } from "../middlewares/jwt.js";
import { company_access } from "../middlewares/company_access.middleware.js";

const router = Router();

router.post("/:company_id", auth, company_access, checkRole("owner", "manager"), createVoucher);
router.get("/:company_id", auth, company_access, getAllVouchers);
router.get("/:company_id/:voucher_id", auth, company_access, getOneVoucher);
router.patch("/:company_id/:voucher_id", auth, company_access, checkRole("owner", "manager"), update);

export default router;