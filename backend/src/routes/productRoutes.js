import { Router } from "express";
import * as products from "../controllers/productController.js";
import { protect, optionalAuth, requireApprovedFarm } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { uploadProductImages } from "../middleware/uploadMiddleware.js";
import { uploadLimiter, writeLimiter } from "../middleware/rateLimiters.js";
import { idParam } from "../validators/common.js";
import {
  createProductSchema,
  updateProductSchema,
  listProductsQuery,
} from "../validators/productValidators.js";
import { ROLES } from "../utils/constants.js";

const router = Router();

/* ---------------- Public marketplace ---------------- */

router.get("/", optionalAuth, validate({ query: listProductsQuery }), products.listProducts);
router.get("/:id", optionalAuth, products.getProduct);

/* ---------------- Farmer writes ----------------
   Three gates, in order: signed in, is a farmer, farm is approved. */

router.post(
  "/",
  protect,
  authorize(ROLES.FARMER),
  requireApprovedFarm,
  uploadLimiter,
  uploadProductImages,
  validate({ body: createProductSchema }),
  products.createProduct
);

router.patch(
  "/:id",
  protect,
  authorize(ROLES.FARMER, ROLES.ADMIN),
  writeLimiter,
  validate({ params: idParam, body: updateProductSchema }),
  products.updateProduct
);

router.post(
  "/:id/images",
  protect,
  authorize(ROLES.FARMER, ROLES.ADMIN),
  uploadLimiter,
  uploadProductImages,
  validate({ params: idParam }),
  products.addProductImages
);

router.delete(
  "/:id/images/:publicId",
  protect,
  authorize(ROLES.FARMER, ROLES.ADMIN),
  products.removeProductImage
);

router.delete(
  "/:id",
  protect,
  authorize(ROLES.FARMER, ROLES.ADMIN),
  validate({ params: idParam }),
  products.deleteProduct
);

export default router;
