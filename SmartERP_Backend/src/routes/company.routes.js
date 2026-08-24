import { Router } from "express";
import {
    createCompany,
    getAllCompany,
    getCompany,
    addToCompany,
    updateCompany
} from "../controllers/company.controller.js";

import { auth } from "../middlewares/jwt.js";
import { company_access } from "../middlewares/company_access.middleware.js";
import { checkRole } from "../middlewares/checkRole.middleware.js";

const router = Router();

router.post("/", auth, createCompany);
router.get("/", auth, getAllCompany);
router.get("/:company_id", auth, company_access, getCompany);
router.patch("/:company_id", auth, company_access, checkRole("owner"), updateCompany);

export default router;