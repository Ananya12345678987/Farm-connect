import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import { ok } from "../utils/ApiResponse.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Wishlist from "../models/Wishlist.js";
import Notification from "../models/Notification.js";
import { sanitize } from "../services/authService.js";
import { ORDER_STATUS } from "../utils/constants.js";

/** GET /api/buyers/me */
export const getMyProfile = asyncHandler(async (req, res) =>
  ok(res, { message: "Profile loaded", data: sanitize(req.user) })
);

/** PATCH /api/buyers/me — business details only. */
export const updateMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { buyerProfile: req.body } },
    { new: true, runValidators: true }
  );

  return ok(res, { message: "Business details updated", data: sanitize(user) });
});

/**
 * GET /api/buyer/dashboard
 *
 * Recommendations are based on the categories this buyer has actually
 * ordered from, falling back to the best-rated listings for a new account —
 * not a random sample dressed up as personalisation.
 */
export const getDashboard = asyncHandler(async (req, res) => {
  const buyerId = new mongoose.Types.ObjectId(req.user._id);

  const [orderStats, recentOrders, wishlist, boughtCategories, activity] = await Promise.all([
    Order.aggregate([
      { $match: { buyer: buyerId } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          activeOrders: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$orderStatus",
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
          spent: {
            $sum: {
              $cond: [{ $eq: ["$orderStatus", ORDER_STATUS.DELIVERED] }, "$totalAmount", 0],
            },
          },
          farmers: { $addToSet: "$subOrders.farmer" },
        },
      },
    ]),

    Order.find({ buyer: buyerId })
      .populate("subOrders.farmer", "name avatar")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),

    Wishlist.findOne({ buyer: buyerId })
      .populate({
        path: "products",
        select: "name slug price unit images availability averageRating farmer",
        populate: { path: "farmer", select: "name" },
      })
      .lean(),

    Order.aggregate([
      { $match: { buyer: buyerId } },
      { $unwind: "$subOrders" },
      { $unwind: "$subOrders.items" },
      {
        $lookup: {
          from: "products",
          localField: "subOrders.items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      { $group: { _id: "$product.category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]),

    Notification.find({ recipient: buyerId }).sort({ createdAt: -1 }).limit(8).lean(),
  ]);

  const categoryIds = boughtCategories.map((entry) => entry._id).filter(Boolean);

  const recommendationFilter = {
    ...Product.publicFilter(),
    quantity: { $gt: 0 },
    ...(categoryIds.length ? { category: { $in: categoryIds } } : {}),
  };

  const recommended = await Product.find(recommendationFilter)
    .select("name slug price unit images availability averageRating reviewCount isOrganic location farmer")
    .populate("farmer", "name")
    .sort({ averageRating: -1, soldCount: -1 })
    .limit(6)
    .lean();

  const stats = orderStats[0] ?? { totalOrders: 0, activeOrders: 0, spent: 0, farmers: [] };
  const farmerCount = new Set(
    (stats.farmers ?? []).flat().map((id) => String(id))
  ).size;

  return ok(res, {
    message: "Dashboard loaded",
    data: {
      stats: [
        { id: "orders", label: "Active orders", value: stats.activeOrders, format: "count" },
        { id: "saved", label: "Saved listings", value: wishlist?.products?.length ?? 0, format: "count" },
        { id: "purchases", label: "Spent on delivered orders", value: Math.round(stats.spent), format: "inr" },
        { id: "farmers", label: "Farms you buy from", value: farmerCount, format: "count" },
      ],
      orders: recentOrders,
      saved: wishlist?.products ?? [],
      recommended,
      activity,
    },
  });
});
