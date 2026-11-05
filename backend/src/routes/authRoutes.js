import { Router } from "express";
import * as auth from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { authLimiter } from "../middleware/rateLimiters.js";
import {
  farmerRegisterSchema,
  buyerRegisterSchema,
  adminRegisterSchema,
  loginSchema,
  changePasswordSchema,
} from "../validators/authValidators.js";

const router = Router();

/* Every unauthenticated entry point is rate limited — this is where
   credential stuffing and mass signup would arrive. */
router.post("/register/farmer", authLimiter, validate({ body: farmerRegisterSchema }), auth.registerFarmer);
router.post("/register/buyer", authLimiter, validate({ body: buyerRegisterSchema }), auth.registerBuyer);
router.post("/register/admin", authLimiter, validate({ body: adminRegisterSchema }), auth.registerAdmin);

router.post("/login", authLimiter, validate({ body: loginSchema }), auth.login);
router.post("/logout", auth.logout);

router.get("/me", protect, auth.me);
router.patch("/password", protect, authLimiter, validate({ body: changePasswordSchema }), auth.changePassword);

export default router;
