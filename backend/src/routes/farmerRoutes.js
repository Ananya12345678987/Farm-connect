import { Router } from "express";
import * as farmer from "../controllers/farmerController.js";
import * as products from "../controllers/productController.js";
import * as orders from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { idParam } from "../validators/common.js";
import { updateFarmSchema } from "../validators/userValidators.js";
import { myProductsQuery } from "../validators/productValidators.js";
import { listOrdersQuery, updateOrderStatusSchema } from "../validators/orderValidators.js";
import { ROLES } from "../utils/constants.js";

/**
 * Two routers, because the URL space has two meanings:
 *   /api/farmers/*  — the public directory of farms
 *   /api/farmer/*   — the signed-in farmer's own workspace
 */

export const publicFarmerRouter = Router();
publicFarmerRouter.get("/", farmer.listFarms);
publicFarmerRouter.get("/me", protect, authorize(ROLES.FARMER), farmer.getMyFarm);
publicFarmerRouter.patch(
  "/me",
  protect,
  authorize(ROLES.FARMER),
  validate({ body: updateFarmSchema }),
  farmer.updateMyFarm
);
publicFarmerRouter.get("/:id", validate({ params: idParam }), farmer.getPublicFarmer);

export const farmerWorkspaceRouter = Router();
farmerWorkspaceRouter.use(protect, authorize(ROLES.FARMER));

farmerWorkspaceRouter.get("/dashboard", farmer.getDashboard);

farmerWorkspaceRouter.get(
  "/products",
  validate({ query: myProductsQuery }),
  products.listMyProducts
);

farmerWorkspaceRouter.get(
  "/orders",
  validate({ query: listOrdersQuery }),
  orders.listFarmerOrders
);
farmerWorkspaceRouter.get(
  "/orders/:id",
  validate({ params: idParam }),
  orders.getFarmerOrder
);
farmerWorkspaceRouter.patch(
  "/orders/:id/status",
  validate({ params: idParam, body: updateOrderStatusSchema }),
  orders.updateFarmerOrderStatus
);

export default farmerWorkspaceRouter;
