import { Router } from "express";
import * as cart from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import {
  addCartItemSchema,
  updateCartItemSchema,
  productIdParam,
} from "../validators/miscValidators.js";
import { ROLES } from "../utils/constants.js";

const router = Router();

/* A cart belongs to a buyer; it is always read from the token, never from a
   path or body parameter. */
router.use(protect, authorize(ROLES.BUYER));

router.get("/", cart.getCart);
router.post("/items", validate({ body: addCartItemSchema }), cart.addItem);
router.patch("/items/:productId", validate({ params: productIdParam, body: updateCartItemSchema }), cart.updateItem);
router.delete("/items/:productId", validate({ params: productIdParam }), cart.removeItem);
router.delete("/", cart.clearCart);

export default router;
