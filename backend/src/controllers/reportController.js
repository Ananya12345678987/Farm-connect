import asyncHandler from "../utils/asyncHandler.js";
import { ok, created, paginated } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { getQuery } from "../middleware/validationMiddleware.js";
import { readPageParams, buildPagination } from "../utils/pagination.js";

import Report from "../models/Report.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Review from "../models/Review.js";
import Order from "../models/Order.js";
import { REPORT_STATUS, REPORT_TARGET } from "../utils/constants.js";

const MODELS = {
  [REPORT_TARGET.PRODUCT]: Product,
  [REPORT_TARGET.USER]: User,
  [REPORT_TARGET.REVIEW]: Review,
  [REPORT_TARGET.ORDER]: Order,
};

/** POST /api/reports — any signed-in user. */
export const createReport = asyncHandler(async (req, res) => {
  const { targetType, targetId } = req.body;

  /* Verify the thing being reported actually exists, so the queue does not
     fill with reports against invented ids. */
  const Model = MODELS[targetType];
  const exists = await Model.exists({ _id: targetId });
  if (!exists) throw ApiError.notFound("That item does not exist", "TARGET_NOT_FOUND");

  if (targetType === REPORT_TARGET.USER && String(targetId) === String(req.user._id)) {
    throw ApiError.badRequest("You cannot report yourself", "SELF_REPORT");
  }

  try {
    const report = await Report.create({ ...req.body, reporter: req.user._id });
    return created(res, {
      message: "Report submitted. Our team will review it.",
      data: report,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw ApiError.conflict(
        "You have already reported this and it is still being reviewed",
        "DUPLICATE_REPORT"
      );
    }
    throw error;
  }
});

/** GET /api/reports/me */
export const listMyReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ reporter: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return ok(res, { message: "Your reports", data: reports });
});

/** GET /api/reports — admin. */
export const listReports = asyncHandler(async (req, res) => {
  const query = getQuery(req);
  const { page, limit, skip } = readPageParams(query);

  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.targetType) filter.targetType = query.targetType;

  const [data, total] = await Promise.all([
    Report.find(filter)
      .populate("reporter", "name email role")
      .populate("handledBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Report.countDocuments(filter),
  ]);

  return paginated(res, {
    message: "Reports loaded",
    data,
    pagination: buildPagination({ page, limit, total }),
  });
});

/** PATCH /api/reports/:id — admin. */
export const resolveReport = asyncHandler(async (req, res) => {
  const report = await Report.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
      resolution: req.body.resolution,
      handledBy: req.user._id,
      handledAt: [REPORT_STATUS.RESOLVED, REPORT_STATUS.REJECTED].includes(req.body.status)
        ? new Date()
        : undefined,
    },
    { new: true }
  );

  if (!report) throw ApiError.notFound("That report does not exist", "REPORT_NOT_FOUND");

  return ok(res, { message: "Report updated", data: report });
});
