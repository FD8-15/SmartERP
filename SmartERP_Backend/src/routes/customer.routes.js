import { Router } from "express";
import { createCustomer,getAllCustomers,getOneCustomer,update } from "../controllers/customer.controller.js";
import { checkRole } from "../middlewares/checkRole.middleware.js";
import { auth } from "../middlewares/jwt.js";
import { company_access } from "../middlewares/company_access.middleware.js";

const router = Router();

router.post("/:company_id", auth, company_access, checkRole("owner", "manager"), createCustomer);
router.get("/:company_id", auth, company_access, getAllCustomers);
router.get("/:company_id/:customer_id", auth, company_access, getOneCustomer);
router.patch("/:company_id/:customer_id", auth, company_access, checkRole("owner", "manager"), update);

export default router;