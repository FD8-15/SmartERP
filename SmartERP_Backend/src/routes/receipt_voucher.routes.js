import { Router } from "express";
import { createReceipt, getAllReceiptsBySalesVoucher, getAllVouchers, getOneVoucher, update } from "../controllers/receipt.controller.js";
import { auth } from "../middlewares/jwt.js";
import { checkRole } from "../middlewares/checkRole.middleware.js";
import { company_access } from "../middlewares/company_access.middleware.js";

const router = Router();

router.post("/:company_id/:sales_id", auth, company_access, checkRole("owner", "manager"), createReceipt);

router.patch("/:company_id/:sales_id/:receipt_id", auth, company_access, checkRole("owner", "manager"), update);

router.get("/:company_id", auth, company_access, getAllVouchers);

router.get("/:company_id/:receipt_id", auth, company_access, getOneVoucher);

router.get("/:company_id/:sales_id/:customer_id", auth, company_access, getAllReceiptsBySalesVoucher);

export default router;