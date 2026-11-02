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
import { validate } from "../middlewares/validate.middleware.js";
import {
    createCompanySchema,
    updateCompanySchema,
    companyIdParamsSchema,
    addUserToCompanySchema
} from "../schemas/company.schema.js";

const router = Router();

router.post("/", auth, validate(createCompanySchema), createCompany);
router.get("/", auth, getAllCompany);
router.get("/:company_id", auth, validate(companyIdParamsSchema), company_access, getCompany);
router.post("/:company_id/users", auth, validate(addUserToCompanySchema), company_access, checkRole("owner", "manager"), addToCompany);
router.patch("/:company_id", auth, validate(updateCompanySchema), company_access, checkRole("owner"), updateCompany);

export default router;
