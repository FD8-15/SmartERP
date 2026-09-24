import { Router } from "express";
import { createCategory, getCategories, getOneCategory, updateCategory, deleteCategory } from "../controllers/categories.controller.js";
import { auth } from "../middlewares/jwt.js";
import { company_access } from "../middlewares/company_access.middleware.js";
import { checkRole } from "../middlewares/checkRole.middleware.js";

const router = Router();

router.post("/:company_id", auth, company_access, checkRole("owner", "manager"), createCategory);
router.get("/:company_id", auth, company_access, getCategories);
router.get("/:company_id/:category_id", auth, company_access, getOneCategory);
router.patch("/:company_id/:category_id", auth, company_access, checkRole("owner", "manager"), updateCategory);
router.delete("/:company_id/:category_id", auth, company_access, checkRole("owner", "manager"), deleteCategory);

export default router;