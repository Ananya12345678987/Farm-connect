import asyncHandler from "../utils/asyncHandler.js";
import { ok, paginated } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { getQuery } from "../middleware/validationMiddleware.js";
import { readPageParams, buildPagination } from "../utils/pagination.js";

import Farm from "../models/Farm.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Notification from "../models/Notification.js";
import mongoose from "mongoose";
import {
  APPROVAL_STATUS,
  ORDER_STATUS,
  VERIFICATION_STATUS,
} from "../utils/constants.js";

/** GET /api/farmers/me */
export const getMyFarm = asyncHandler(async (req, res) => {
  const farm = await Farm.findOne({ farmer: req.user._id }).lean();
  if (!farm) throw ApiError.notFound("You have no farm profile yet", "FARM_NOT_FOUND");
  return ok(res, { message: "Farm loaded", data: farm });
});

/**
 * PATCH /api/farmers/me
 * Verification fields are not in the update schema, so a farmer cannot
 * approve themselves by sending verificationStatus.
 */
export const updateMyFarm = asyncHandler(async (req, res) => {
  const farm = await Farm.findOneAndUpdate({ farmer: req.user._id }, req.body, {
    new: true,
    runValidators: true,
  });

  if (!farm) throw ApiError.notFound("You have no farm profile yet", "FARM_NOT_FOUND");
  return ok(res, { message: "Farm updated", data: farm });
});

/**
 * GET /api/farmers/:id — public farmer profile.
 * Deliberately narrow: name, photo, farm and public listings. No email, no
 * phone, no address, no order history.
 */
export const getPublicFarmer = asyncHandler(async (req, res) => {
  const farm = await Farm.findOne({
    farmer: req.params.id,
    verificationStatus: VERIFICATION_STATUS.APPROVED,
  })
    .populate("farmer", "name avatar location createdAt")
    .select("farmName description location district state farmType crops averageRating reviewCount productCount createdAt farmer")
    .lean();

  if (!farm) throw ApiError.notFound("That farm is not listed", "FARM_NOT_FOUND");

  const products = await Product.find({
    farmer: req.params.id,
    ...Product.publicFilter(),
  })
    .select("name slug price unit images availability averageRating reviewCount isOrganic")
    .sort({ createdAt: -1 })
    .limit(12)
    .lean();

  return ok(res, { message: "Farm profile loaded", data: { farm, products } });
});

/** GET /api/farmers — public directory of approved farms. */
export const listFarms = asyncHandler(async (req, res) => {
  const query = getQuery(req);
  const { page, limit, skip } = readPageParams(query);

  const filter = { verificationStatus: VERIFICATION_STATUS.APPROVED };
  if (query.state) filter.state = new RegExp(`^${query.state}$`, "i");
  if (query.search) filter.$text = { $search: query.search };

  const [data, total] = await Promise.all([
    Farm.find(filter)
      .populate("farmer", "name avatar")
      .select("farmName location district state farmType averageRating reviewCount productCount farmer")
      .sort({ averageRating: -1, productCount: -1 })
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
 * GET /api/farmer/dashboard
 *
 * One request, shaped for the dashboard the frontend already renders:
 * metric tiles, a monthly sales chart, recent listings, recent orders and an
 * activity feed. The counts run as one aggregation rather than six
 * countDocuments round-trips.
 */
export const getDashboard = asyncHandler(async (req, res) => {
  const farmerId = new mongoose.Types.ObjectId(req.user._id);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5, 1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [farm, productStats, orderStats, salesByMonth, recentProducts, recentOrders, activity] =
    await Promise.all([
      Farm.findOne({ farmer: farmerId }).lean(),

      Product.aggregate([
        { $match: { farmer: farmerId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            live: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ["$approvalStatus", APPROVAL_STATUS.APPROVED] }, "$isActive"] },
                  1,
                  0,
                ],
              },
            },
            pending: {
              $sum: { $cond: [{ $eq: ["$approvalStatus", APPROVAL_STATUS.PENDING] }, 1, 0] },
            },
            outOfStock: { $sum: { $cond: [{ $lte: ["$quantity", 0] }, 1, 0] } },
          },
        },
      ]),

      Order.aggregate([
        { $unwind: "$subOrders" },
        { $match: { "subOrders.farmer": farmerId } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            activeOrders: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      "$subOrders.status",
                      [
                        ORDER_STATUS.PLACED,
                        ORDER_STATUS.CONFIRMED,
                        ORDER_STATUS.PROCESSING,
                        ORDER_STATUS.READY,
                        ORDER_STATUS.OUT_FOR_DELIVERY,
                      ],
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            delivered: {
              $sum: { $cond: [{ $eq: ["$subOrders.status", ORDER_STATUS.DELIVERED] }, 1, 0] },
            },
            /* Revenue counts delivered portions only — an order that is still
               in transit is not money earned. */
            revenue: {
              $sum: {
                $cond: [
                  { $eq: ["$subOrders.status", ORDER_STATUS.DELIVERED] },
                  "$subOrders.subtotal",
                  0,
                ],
              },
            },
            buyers: { $addToSet: "$buyer" },
          },
        },
        { $project: { totalOrders: 1, activeOrders: 1, delivered: 1, revenue: 1, buyerCount: { $size: "$buyers" } } },
      ]),

      Order.aggregate([
        { $unwind: "$subOrders" },
        {
          $match: {
            "subOrders.farmer": farmerId,
            "subOrders.status": ORDER_STATUS.DELIVERED,
            createdAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
            value: { $sum: "$subOrders.subtotal" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      Product.find({ farmer: farmerId })
        .select("name slug price unit quantity images availability approvalStatus createdAt")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),

      Order.find({ "subOrders.farmer": farmerId })
        .populate("buyer", "name")
        .sort({ createdAt: -1 })
        .limit(6),

      Notification.find({ recipient: farmerId })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
    ]);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const sales = salesByMonth.map((entry) => ({
    label: months[entry._id.month - 1],
    value: Math.round(entry.value),
  }));

  const products = productStats[0] ?? { total: 0, live: 0, pending: 0, outOfStock: 0 };
  const orders = orderStats[0] ?? {
    totalOrders: 0,
    activeOrders: 0,
    delivered: 0,
    revenue: 0,
    buyerCount: 0,
  };

  /* Each farmer only ever sees their own slice of each order. */
  const orderSummaries = recentOrders.map((order) => {
    const sub = order.subOrders.find((entry) => String(entry.farmer) === String(farmerId));
    return {
      _id: order._id,
      orderNumber: order.orderNumber,
      buyer: order.buyer,
      itemCount: sub.items.length,
      total: sub.total,
      status: sub.status,
      createdAt: order.createdAt,
    };
  });

  return ok(res, {
    message: "Dashboard loaded",
    data: {
      farm: farm
        ? {
            farmName: farm.farmName,
            location: farm.location,
            verificationStatus: farm.verificationStatus,
            isVerified: farm.isVerified,
            averageRating: farm.averageRating,
          }
        : null,
      stats: [
        { id: "listings", label: "Live listings", value: products.live, format: "count" },
        { id: "orders", label: "Active orders", value: orders.activeOrders, format: "count" },
        { id: "revenue", label: "Revenue delivered", value: Math.round(orders.revenue), format: "inr" },
        { id: "buyers", label: "Buyer connections", value: orders.buyerCount, format: "count" },
      ],
      products,
      sales,
      listings: recentProducts,
      orders: orderSummaries,
      activity,
    },
  });
});
