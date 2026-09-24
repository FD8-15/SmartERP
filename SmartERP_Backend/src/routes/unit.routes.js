import { Router } from "express";
import { createUnit, getUnits, getOneUnit, updateUnit } from "../controllers/unit.controller.js";
import { auth } from "../middlewares/jwt.js";
import { company_access } from "../middlewares/company_access.middleware.js";
import { checkRole } from "../middlewares/checkRole.middleware.js";

const router = Router();

router.post("/:company_id", auth, company_access, checkRole("owner", "manager"), createUnit);
router.get("/:company_id", auth, company_access, getUnits);
router.get("/:company_id/:unit_id", auth, company_access, getOneUnit);
router.patch("/:company_id/:unit_id", auth, company_access, checkRole("owner", "manager"), updateUnit);

export default router;