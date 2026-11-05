import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import { ok, paginated } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { getQuery } from "../middleware/validationMiddleware.js";
import { readPageParams, buildPagination } from "../utils/pagination.js";

import User from "../models/User.js";
import Farm from "../models/Farm.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Review from "../models/Review.js";
import Report from "../models/Report.js";
import Category from "../models/Category.js";

import {
  notifyFarmerApproved,
  notifyFarmerRejected,
  notifyProductApproved,
  notifyProductRejected,
  notifyAccountSuspended,
} from "../services/notificationService.js";
import { farmerApproved, productApproved } from "../services/socketService.js";
import {
  ROLES,
  APPROVAL_STATUS,
  VERIFICATION_STATUS,
  ORDER_STATUS,
  REPORT_STATUS,
} from "../utils/constants.js";

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * GET /api/admin/dashboard
 *
 * Everything the admin console renders, shaped for its cards, charts and
 * tables. Counts are gathered with faceted aggregations rather than a dozen
 * separate round-trips.
 */
export const getDashboard = asyncHandler(async (_req, res) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5, 1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [userFacet, productFacet, orderFacet, growth, categorySplit, pendingFarms, flagged, recentReports] =
    await Promise.all([
      User.aggregate([
        {
          $facet: {
            total: [{ $count: "n" }],
            byRole: [{ $group: { _id: "$role", n: { $sum: 1 } } }],
            suspended: [{ $match: { isActive: false } }, { $count: "n" }],
          },
        },
      ]),

      Product.aggregate([
        {
          $facet: {
            total: [{ $count: "n" }],
            pending: [{ $match: { approvalStatus: APPROVAL_STATUS.PENDING } }, { $count: "n" }],
            live: [
              { $match: { approvalStatus: APPROVAL_STATUS.APPROVED, isActive: true } },
              { $count: "n" },
            ],
          },
        },
      ]),

      Order.aggregate([
        {
          $facet: {
            total: [{ $count: "n" }],
            completed: [{ $match: { orderStatus: ORDER_STATUS.DELIVERED } }, { $count: "n" }],
            cancelled: [{ $match: { orderStatus: ORDER_STATUS.CANCELLED } }, { $count: "n" }],
            value: [
              { $match: { orderStatus: ORDER_STATUS.DELIVERED } },
              { $group: { _id: null, sum: { $sum: "$totalAmount" } } },
            ],
          },
        },
      ]),

      Farm.aggregate([
        {
          $match: {
            verificationStatus: VERIFICATION_STATUS.APPROVED,
            createdAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
            value: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      Product.aggregate([
        { $match: { approvalStatus: APPROVAL_STATUS.APPROVED, isActive: true } },
        { $group: { _id: "$category", n: { $sum: 1 } } },
        { $sort: { n: -1 } },
        { $limit: 6 },
        {
          $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" },
        },
        { $unwind: "$category" },
        { $project: { label: "$category.name", value: "$n" } },
      ]),

      Farm.find({ verificationStatus: { $ne: VERIFICATION_STATUS.APPROVED } })
        .populate("farmer", "name email createdAt")
        .select("farmName location state verificationStatus createdAt farmer")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),

      Product.find({ approvalStatus: APPROVAL_STATUS.PENDING })
        .populate("farmer", "name")
        .select("name price unit createdAt farmer")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),

      Report.find({ status: { $in: [REPORT_STATUS.PENDING, REPORT_STATUS.REVIEWING] } })
        .populate("reporter", "name")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
    ]);

  const first = (facet, key) => facet[0]?.[key]?.[0]?.n ?? 0;
  const roleCount = (role) =>
    userFacet[0]?.byRole?.find((entry) => entry._id === role)?.n ?? 0;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const totalSplit = categorySplit.reduce((sum, entry) => sum + entry.value, 0) || 1;

  return ok(res, {
    message: "Dashboard loaded",
    data: {
      stats: [
        { id: "farmers", label: "Verified farmers", value: roleCount(ROLES.FARMER), format: "count" },
        { id: "buyers", label: "Active buyers", value: roleCount(ROLES.BUYER), format: "count" },
        { id: "listings", label: "Live listings", value: first(productFacet, "live"), format: "count" },
        {
          id: "gmv",
          label: "Traded value",
          value: Math.round(orderFacet[0]?.value?.[0]?.sum ?? 0),
          format: "inr",
        },
      ],
      users: {
        total: first(userFacet, "total"),
        farmers: roleCount(ROLES.FARMER),
        buyers: roleCount(ROLES.BUYER),
        admins: roleCount(ROLES.ADMIN),
        suspended: first(userFacet, "suspended"),
      },
      products: {
        total: first(productFacet, "total"),
        pending: first(productFacet, "pending"),
        live: first(productFacet, "live"),
      },
      orders: {
        total: first(orderFacet, "total"),
        completed: first(orderFacet, "completed"),
        cancelled: first(orderFacet, "cancelled"),
        value: Math.round(orderFacet[0]?.value?.[0]?.sum ?? 0),
      },
      growth: growth.map((entry) => ({
        label: months[entry._id.month - 1],
        value: entry.value,
      })),
      categorySplit: categorySplit.map((entry) => ({
        label: entry.label,
        value: Math.round((entry.value / totalSplit) * 100),
      })),
      pendingFarmers: pendingFarms,
      pendingProducts: flagged,
      reports: recentReports,
    },
  });
});

/* ------------------------------------------------------------------ *
 * Users
 * ------------------------------------------------------------------ */

/** GET /api/admin/users */
export const listUsers = asyncHandler(async (req, res) => {
  const query = getQuery(req);
  const { page, limit, skip } = readPageParams(query);

  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.isActive !== undefined) filter.isActive = query.isActive === "true";
  if (query.search) {
    const rx = new RegExp(escapeRegex(query.search), "i");
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const sorts = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, name: { name: 1 } };

  const [data, total] = await Promise.all([
    User.find(filter)
      .select("name email phone role avatar location isActive isVerified createdAt lastLoginAt")
      .sort(sorts[query.sort] ?? sorts.newest)
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return paginated(res, {
    message: "Users loaded",
    data,
    pagination: buildPagination({ page, limit, total }),
  });
});

/** GET /api/admin/users/:id */
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("name email phone role avatar location isActive isVerified createdAt lastLoginAt suspendedReason")
    .lean();

  if (!user) throw ApiError.notFound("That user does not exist", "USER_NOT_FOUND");

  const extras = {};
  if (user.role === ROLES.FARMER) {
    extras.farm = await Farm.findOne({ farmer: user._id }).lean();
    extras.productCount = await Product.countDocuments({ farmer: user._id });
  }
  if (user.role === ROLES.BUYER) {
    extras.orderCount = await Order.countDocuments({ buyer: user._id });
  }

  return ok(res, { message: "User loaded", data: { user, ...extras } });
});

/**
 * PATCH /api/admin/users/:id/status — suspend or reinstate.
 *
 * Deactivation rather than deletion: a farmer's past orders, reviews and
 * order history all reference this user, and removing the row would leave
 * every one of them pointing at nothing.
 */
export const setUserStatus = asyncHandler(async (req, res) => {
  const { isActive, reason } = req.body;

  if (String(req.params.id) === String(req.user._id)) {
    throw ApiError.badRequest("You cannot suspend your own account", "SELF_SUSPEND");
  }

  const target = await User.findById(req.params.id).select("role name isActive");
  if (!target) throw ApiError.notFound("That user does not exist", "USER_NOT_FOUND");

  if (target.role === ROLES.ADMIN && !isActive) {
    throw ApiError.forbidden("Administrator accounts cannot be suspended here", "ADMIN_PROTECTED");
  }

  target.isActive = isActive;
  target.suspendedReason = isActive ? undefined : reason;
  await target.save();

  if (!isActive) {
    /* Their listings come down with them. */
    await Product.updateMany({ farmer: target._id }, { isActive: false });
    await notifyAccountSuspended(target._id, reason);
  }

  return ok(res, {
    message: isActive ? "Account reinstated" : "Account suspended",
    data: { _id: target._id, isActive: target.isActive },
  });
});

/* ------------------------------------------------------------------ *
 * Farm verification
 * ------------------------------------------------------------------ */

/** GET /api/admin/farms */
export const listFarms = asyncHandler(async (req, res) => {
  const query = getQuery(req);
  const { page, limit, skip } = readPageParams(query);

  const filter = {};
  if (query.verificationStatus) filter.verificationStatus = query.verificationStatus;
  if (query.state) filter.state = new RegExp(`^${escapeRegex(query.state)}$`, "i");
  if (query.search) filter.$text = { $search: query.search };

  const [data, total] = await Promise.all([
    Farm.find(filter)
      .populate("farmer", "name email phone createdAt isActive")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Farm.countDocuments(filter),
  ]);

  return paginated(res, {
    message: "Farms loaded",
    data,
    pagination: buildPagination({ page, limit, total }),
  });
});

/**
 * PATCH /api/admin/farms/:id/verify
 * Approving here is the gate that lets a farmer list at all.
 */
export const verifyFarm = asyncHandler(async (req, res) => {
  const { action, note } = req.body;

  const farm = await Farm.findById(req.params.id).populate("farmer", "name");
  if (!farm) throw ApiError.notFound("That farm does not exist", "FARM_NOT_FOUND");

  farm.verificationStatus =
    action === "APPROVE" ? VERIFICATION_STATUS.APPROVED : VERIFICATION_STATUS.REJECTED;
  farm.verificationNote = note;
  farm.verifiedAt = new Date();
  farm.verifiedBy = req.user._id;
  await farm.save();

  if (action === "APPROVE") {
    await User.updateOne({ _id: farm.farmer._id }, { isVerified: true });
    await notifyFarmerApproved(farm.farmer._id, farm.farmName);
    farmerApproved(farm.farmer._id, { farmId: farm._id, farmName: farm.farmName });
  } else {
    await notifyFarmerRejected(farm.farmer._id, farm.farmName, note);
  }

  return ok(res, {
    message: action === "APPROVE" ? "Farm approved" : "Farm rejected",
    data: farm,
  });
});

/* ------------------------------------------------------------------ *
 * Product moderation
 * ------------------------------------------------------------------ */

/** GET /api/admin/products */
export const listProducts = asyncHandler(async (req, res) => {
  const query = getQuery(req);
  const { page, limit, skip } = readPageParams(query);

  const filter = {};
  if (query.approvalStatus) filter.approvalStatus = query.approvalStatus;
  if (query.search) filter.name = new RegExp(escapeRegex(query.search), "i");

  const [data, total] = await Promise.all([
    Product.find(filter)
      .populate("farmer", "name email")
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return paginated(res, {
    message: "Products loaded",
    data,
    pagination: buildPagination({ page, limit, total }),
  });
});

/** PATCH /api/admin/products/:id/moderate */
export const moderateProduct = asyncHandler(async (req, res) => {
  const { action, reason } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound("That listing does not exist", "PRODUCT_NOT_FOUND");

  switch (action) {
    case "APPROVE":
      product.approvalStatus = APPROVAL_STATUS.APPROVED;
      product.rejectionReason = undefined;
      product.approvedAt = new Date();
      product.approvedBy = req.user._id;
      break;
    case "REJECT":
      product.approvalStatus = APPROVAL_STATUS.REJECTED;
      product.rejectionReason = reason;
      break;
    case "ACTIVATE":
      product.isActive = true;
      break;
    case "DEACTIVATE":
      product.isActive = false;
      break;
    default:
      throw ApiError.badRequest("Unknown moderation action", "UNKNOWN_ACTION");
  }

  await product.save();

  if (action === "APPROVE") {
    await notifyProductApproved(product.farmer, product);
    productApproved(product.farmer, { productId: product._id, name: product.name });
  }
  if (action === "REJECT") {
    await notifyProductRejected(product.farmer, product, reason);
  }

  return ok(res, { message: `Listing ${action.toLowerCase()}d`, data: product });
});

/* ------------------------------------------------------------------ *
 * Orders and reviews
 * ------------------------------------------------------------------ */

/** GET /api/admin/orders — read and monitor. There is deliberately no
 *  endpoint here for arbitrarily rewriting an order's status. */
export const listOrders = asyncHandler(async (req, res) => {
  const query = getQuery(req);
  const { page, limit, skip } = readPageParams(query);

  const filter = {};
  if (query.status) filter.orderStatus = query.status;
  if (query.search) filter.orderNumber = new RegExp(escapeRegex(query.search), "i");

  const [data, total] = await Promise.all([
    Order.find(filter)
      .populate("buyer", "name email")
      .populate("subOrders.farmer", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return paginated(res, {
    message: "Orders loaded",
    data,
    pagination: buildPagination({ page, limit, total }),
  });
});

/** PATCH /api/admin/reviews/:id/visibility — hide a reported review rather
 *  than delete it, so the record survives an appeal. */
export const setReviewVisibility = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { isHidden: Boolean(req.body.isHidden), hiddenReason: req.body.reason },
    { new: true }
  );

  if (!review) throw ApiError.notFound("That review does not exist", "REVIEW_NOT_FOUND");

  const [stats] = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(review.product), isHidden: false } },
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  await Product.updateOne(
    { _id: review.product },
    {
      averageRating: Math.round((stats?.average ?? 0) * 10) / 10,
      reviewCount: stats?.count ?? 0,
    }
  );

  return ok(res, {
    message: review.isHidden ? "Review hidden" : "Review restored",
    data: review,
  });
});

/** GET /api/admin/categories — includes inactive ones. */
export const listAllCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ name: 1 }).lean();
  return ok(res, { message: "Categories loaded", data: categories });
});
