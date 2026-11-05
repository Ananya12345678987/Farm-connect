import { Router } from "express";
import * as users from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { uploadAvatar } from "../middleware/uploadMiddleware.js";
import { uploadLimiter } from "../middleware/rateLimiters.js";
import { updateMeSchema, addressSchema } from "../validators/userValidators.js";

const router = Router();

router.use(protect);

router.get("/me", users.getMe);
router.patch("/me", validate({ body: updateMeSchema }), users.updateMe);

router.post("/me/avatar", uploadLimiter, uploadAvatar, users.updateAvatar);

router.post("/me/addresses", validate({ body: addressSchema }), users.addAddress);
router.delete("/me/addresses/:index", users.removeAddress);

export default router;
