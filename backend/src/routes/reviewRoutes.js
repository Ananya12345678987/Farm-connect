import { Router } from "express";
import * as reviews from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { writeLimiter } from "../middleware/rateLimiters.js";
import { idParam, objectId } from "../validators/common.js";
import { z } from "zod";
import {
  createReviewSchema,
  updateReviewSchema,
  listReviewsQuery,
} from "../validators/miscValidators.js";
import { ROLES } from "../utils/constants.js";

const router = Router();

router.get(
  "/product/:productId",
  validate({ params: z.object({ productId: objectId }), query: listReviewsQuery }),
  reviews.listProductReviews
);

router.use(protect);

router.get("/me", authorize(ROLES.BUYER), reviews.listMyReviews);

router.post(
  "/",
  authorize(ROLES.BUYER),
  writeLimiter,
  validate({ body: createReviewSchema }),
  reviews.createReview
);

router.patch(
  "/:id",
  authorize(ROLES.BUYER),
  validate({ params: idParam, body: updateReviewSchema }),
  reviews.updateReview
);

router.delete(
  "/:id",
  authorize(ROLES.BUYER, ROLES.ADMIN),
  validate({ params: idParam }),
  reviews.deleteReview
);

export default router;
