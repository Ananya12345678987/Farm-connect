import { Router } from "express";
import * as orders from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { writeLimiter } from "../middleware/rateLimiters.js";
import { idParam } from "../validators/common.js";
import {
  createOrderSchema,
  listOrdersQuery,
  cancelOrderSchema,
} from "../validators/orderValidators.js";
import { ROLES } from "../utils/constants.js";

const router = Router();

router.use(protect);

router.post(
  "/",
  authorize(ROLES.BUYER),
  writeLimiter,
  validate({ body: createOrderSchema }),
  orders.createOrder
);

router.get("/", authorize(ROLES.BUYER), validate({ query: listOrdersQuery }), orders.listMyOrders);
router.get("/:id", validate({ params: idParam }), orders.getOrder);

router.patch(
  "/:id/cancel",
  authorize(ROLES.BUYER),
  validate({ params: idParam, body: cancelOrderSchema }),
  orders.cancelOrder
);

export default router;
