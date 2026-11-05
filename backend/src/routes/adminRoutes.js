import { Router } from "express";
import { z } from "zod";
import * as admin from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { idParam, shortText } from "../validators/common.js";
import { listUsersQuery } from "../validators/userValidators.js";
import { moderateProductSchema } from "../validators/productValidators.js";
import {
  moderateFarmerSchema,
  suspendUserSchema,
  listFarmsQuery,
  adminOrdersQuery,
} from "../validators/miscValidators.js";
import { ROLES } from "../utils/constants.js";

const router = Router();

/* One gate for the entire admin surface. No admin controller is reachable
   without both of these passing. */
router.use(protect, authorize(ROLES.ADMIN));

router.get("/dashboard", admin.getDashboard);

router.get("/users", validate({ query: listUsersQuery }), admin.listUsers);
router.get("/users/:id", validate({ params: idParam }), admin.getUser);
router.patch(
  "/users/:id/status",
  validate({ params: idParam, body: suspendUserSchema }),
  admin.setUserStatus
);

router.get("/farms", validate({ query: listFarmsQuery }), admin.listFarms);
router.patch(
  "/farms/:id/verify",
  validate({ params: idParam, body: moderateFarmerSchema }),
  admin.verifyFarm
);

router.get("/products", admin.listProducts);
router.patch(
  "/products/:id/moderate",
  validate({ params: idParam, body: moderateProductSchema }),
  admin.moderateProduct
);

router.get("/orders", validate({ query: adminOrdersQuery }), admin.listOrders);

router.get("/categories", admin.listAllCategories);

router.patch(
  "/reviews/:id/visibility",
  validate({
    params: idParam,
    body: z.object({ isHidden: z.boolean(), reason: shortText(300).optional() }),
  }),
  admin.setReviewVisibility
);

export default router;
