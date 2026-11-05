import { Router } from "express";
import * as notifications from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { idParam } from "../validators/common.js";
import { listNotificationsQuery } from "../validators/miscValidators.js";

const router = Router();

router.use(protect);

router.get("/", validate({ query: listNotificationsQuery }), notifications.listNotifications);
router.get("/unread-count", notifications.unreadCount);
router.patch("/read-all", notifications.markAllRead);
router.patch("/:id/read", validate({ params: idParam }), notifications.markRead);
router.delete("/:id", validate({ params: idParam }), notifications.removeNotification);

export default router;
