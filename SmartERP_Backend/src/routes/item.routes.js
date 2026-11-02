import { Router } from "express";
import { createItem, getItems, getOneItem, update } from "../controllers/item.controller.js";
import { auth } from "../middlewares/jwt.js";
import { company_access } from "../middlewares/company_access.middleware.js";
import { checkRole } from "../middlewares/checkRole.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createItemSchema, updateItemSchema } from "../schemas/item.schema.js";

const router = Router();

router.post("/:company_id", auth, validate(createItemSchema), company_access, checkRole("owner", "manager"), createItem);
router.get("/:company_id", auth, company_access, getItems);
router.get("/:company_id/:item_id", auth, company_access, getOneItem);
router.patch("/:company_id/:item_id", auth, validate(updateItemSchema), company_access, checkRole("owner", "manager"), update);

export default router;
