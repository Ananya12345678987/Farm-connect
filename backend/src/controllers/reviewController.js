import asyncHandler from "../utils/asyncHandler.js";
import { ok, created, paginated } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { getQuery } from "../middleware/validationMiddleware.js";
import { readPageParams, buildPagination } from "../utils/pagination.js";
import { assertOwnership } from "../middleware/roleMiddleware.js";

import Review from "../models/Review.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Farm from "../models/Farm.js";
import { notifyNewReview } from "../services/notificationService.js";
import { ORDER_STATUS } from "../utils/constants.js";

/**
 * Recomputes a product's stored rating aggregate, and the farm's.
 *
 * Ratings are stored rather than aggregated per request: a marketplace page
 * showing twelve products would otherwise run twelve aggregations. This runs
 * only when a review is written, changed or removed.
 */
const recomputeRatings = async (productId, farmerId) => {
  const [productStats] = await Review.aggregate([
    { $match: { product: productId, isHidden: false } },
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  await Product.updateOne(
    { _id: productId },
    {
      averageRating: Math.round((productStats?.average ?? 0) * 10) / 10,
      reviewCount: productStats?.count ?? 0,
    }
  );

  const [farmStats] = await Review.aggregate([
    { $match: { farmer: farmerId, isHidden: false } },
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  await Farm.updateOne(
    { farmer: farmerId },
    {
      averageRating: Math.round((farmStats?.average ?? 0) * 10) / 10,
      reviewCount: farmStats?.count ?? 0,
    }
  );
};

/**
 * POST /api/reviews — buyer only.
 *
 * Three gates, all against the database: the order must be theirs, it must
 * contain this product, and that farmer's portion must have been delivered.
 * The unique index on (buyer, product, order) stops a second review of the
 * same purchase even under a double-submit.
 */
export const createReview = asyncHandler(async (req, res) => {
  const { product: productId, order: orderId, rating, comment } = req.body;

  const order = await Order.findOne({ _id: orderId, buyer: req.user._id });
  if (!order) {
    throw ApiError.forbidden("You can only review something you bought", "NOT_ORDER_OWNER");
  }

  const sub = order.subOrders.find((entry) =>
    entry.items.some((item) => String(item.product) === String(productId))
  );

  if (!sub) {
    throw ApiError.badRequest("That item is not part of this order", "ITEM_NOT_IN_ORDER");
  }
  if (sub.status !== ORDER_STATUS.DELIVERED) {
    throw ApiError.badRequest(
      "You can review this once it has been delivered",
      "ORDER_NOT_DELIVERED"
    );
  }

  const existing = await Review.findOne({
    buyer: req.user._id,
    product: productId,
    order: orderId,
  }).select("_id");

  if (existing) {
    throw ApiError.conflict("You have already reviewed this purchase", "DUPLICATE_REVIEW");
  }

  const review = await Review.create({
    buyer: req.user._id,
    product: productId,
    farmer: sub.farmer,
    order: orderId,
    rating,
    comment,
  });

  await recomputeRatings(review.product, review.farmer);

  const product = await Product.findById(productId).select("name");
  await notifyNewReview(sub.farmer, product, rating);

  return created(res, { message: "Thanks for the review", data: review });
});

/** GET /api/reviews/product/:productId — public. */
export const listProductReviews = asyncHandler(async (req, res) => {
  const query = getQuery(req);
  const { page, limit, skip } = readPageParams(query);

  const filter = { product: req.params.productId, isHidden: false };
  if (query.rating) filter.rating = query.rating;

  const sorts = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    rating_high: { rating: -1, createdAt: -1 },
    rating_low: { rating: 1, createdAt: -1 },
  };

  const [data, total] = await Promise.all([
    Review.find(filter)
      .populate("buyer", "name avatar")
      .sort(sorts[query.sort] ?? sorts.newest)
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);

  return paginated(res, {
    message: "Reviews loaded",
    data,
    pagination: buildPagination({ page, limit, total }),
  });
});

/** GET /api/reviews/me — the buyer's own reviews. */
export const listMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ buyer: req.user._id })
    .populate("product", "name slug images")
    .sort({ createdAt: -1 })
    .lean();

  return ok(res, { message: "Your reviews", data: reviews });
});

/** PATCH /api/reviews/:id — author only. */
export const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound("That review does not exist", "REVIEW_NOT_FOUND");

  assertOwnership(review.buyer, req.user, "You can only edit your own review");

  Object.assign(review, req.body);
  await review.save();
  await recomputeRatings(review.product, review.farmer);

  return ok(res, { message: "Review updated", data: review });
});

/** DELETE /api/reviews/:id — author or admin. */
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound("That review does not exist", "REVIEW_NOT_FOUND");

  assertOwnership(review.buyer, req.user, "You can only remove your own review");

  const { product, farmer } = review;
  await review.deleteOne();
  await recomputeRatings(product, farmer);

  return ok(res, { message: "Review removed", data: null });
});

export { recomputeRatings };
