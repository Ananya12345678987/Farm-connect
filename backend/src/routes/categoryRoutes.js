import { Router } from "express";
import * as categories from "../controllers/categoryController.js";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { idParam } from "../validators/common.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/miscValidators.js";
import { ROLES } from "../utils/constants.js";

const router = Router();

router.get("/", optionalAuth, categories.listCategories);

router.use(protect, authorize(ROLES.ADMIN));
router.post("/", validate({ body: createCategorySchema }), categories.createCategory);
router.patch("/:id", validate({ params: idParam, body: updateCategorySchema }), categories.updateCategory);
router.delete("/:id", validate({ params: idParam }), categories.deleteCategory);

export default router;
