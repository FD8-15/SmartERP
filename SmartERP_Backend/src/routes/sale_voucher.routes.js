import { Router } from "express";
import { createVoucher,getAllVouchers,getOneVoucher,update } from "../controllers/sale _voucher.controller.js";
import { auth } from "../middlewares/jwt.js";
import { company_access } from "../middlewares/company_access.middleware.js";
import { checkRole } from "../middlewares/checkRole.middleware.js";

const router = Router();

router.post("/:company_id/:customer_id/:contact_no", auth, company_access, checkRole("owner", "manager"), createVoucher);

router.get("/:company_id", auth, company_access, getAllVouchers);

router.get("/:company_id/:sales_id", auth, company_access, getOneVoucher);

router.patch("/:company_id/:sales_id", auth, company_access, checkRole("owner", "manager"), update);

export default router;