import { Router } from "express";
import * as buyer from "../controllers/buyerController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { updateBuyerSchema } from "../validators/userValidators.js";
import { ROLES } from "../utils/constants.js";

export const buyerProfileRouter = Router();
buyerProfileRouter.use(protect, authorize(ROLES.BUYER));
buyerProfileRouter.get("/me", buyer.getMyProfile);
buyerProfileRouter.patch("/me", validate({ body: updateBuyerSchema }), buyer.updateMyProfile);

export const buyerWorkspaceRouter = Router();
buyerWorkspaceRouter.use(protect, authorize(ROLES.BUYER));
buyerWorkspaceRouter.get("/dashboard", buyer.getDashboard);

export default buyerWorkspaceRouter;
