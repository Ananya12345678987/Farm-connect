import { Router } from "express";
import * as reports from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { writeLimiter } from "../middleware/rateLimiters.js";
import { idParam } from "../validators/common.js";
import {
  createReportSchema,
  resolveReportSchema,
  listReportsQuery,
} from "../validators/miscValidators.js";
import { ROLES } from "../utils/constants.js";

const router = Router();

router.use(protect);

router.post("/", writeLimiter, validate({ body: createReportSchema }), reports.createReport);
router.get("/me", reports.listMyReports);

router.get("/", authorize(ROLES.ADMIN), validate({ query: listReportsQuery }), reports.listReports);
router.patch(
  "/:id",
  authorize(ROLES.ADMIN),
  validate({ params: idParam, body: resolveReportSchema }),
  reports.resolveReport
);

export default router;
