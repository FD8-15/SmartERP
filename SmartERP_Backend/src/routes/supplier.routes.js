import { Router } from "express";
import { createSupplier, getAllSupplier, getOneSupplier, updateSupplier } from "../controllers/supplier.controller.js";
import { checkRole } from "../middlewares/checkRole.middleware.js";
import { auth } from "../middlewares/jwt.js";
import { company_access } from "../middlewares/company_access.middleware.js";

const router = Router();

router.post("/:company_id", auth, company_access, checkRole("owner", "manager"), createSupplier); router.get("/:company_id", auth, company_access, getAllSupplier);
router.get("/:company_id/:supplier_id", auth, company_access, getOneSupplier);
router.patch("/:company_id/:supplier_id", auth, company_access, checkRole("owner","manager"), updateSupplier);
export default router;



