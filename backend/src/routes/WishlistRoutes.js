import { Router } from "express";
import * as wishlist from "../controllers/wishlistController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { productIdParam } from "../validators/miscValidators.js";
import { ROLES } from "../utils/constants.js";

const router = Router();

router.use(protect, authorize(ROLES.BUYER));

router.get("/", wishlist.getWishlist);
router.post("/:productId", validate({ params: productIdParam }), wishlist.addToWishlist);
router.delete("/:productId", validate({ params: productIdParam }), wishlist.removeFromWishlist);

export default router;
