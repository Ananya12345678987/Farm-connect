import { Router } from "express";
import * as messages from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { writeLimiter } from "../middleware/rateLimiters.js";
import { idParam } from "../validators/common.js";
import {
  startConversationSchema,
  sendMessageSchema,
} from "../validators/miscValidators.js";

const router = Router();

router.use(protect);

router.get("/", messages.listConversations);
router.post("/", writeLimiter, validate({ body: startConversationSchema }), messages.startConversation);

router.get("/:id/messages", validate({ params: idParam }), messages.listMessages);
router.post(
  "/:id/messages",
  writeLimiter,
  validate({ params: idParam, body: sendMessageSchema }),
  messages.sendMessage
);
router.patch("/:id/read", validate({ params: idParam }), messages.markConversationRead);

export default router;
