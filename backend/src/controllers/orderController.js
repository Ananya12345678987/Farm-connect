import asyncHandler from "../utils/asyncHandler.js";
import { ok, created, paginated } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { getQuery } from "../middleware/validationMiddleware.js";
import { readPageParams, buildPagination } from "../utils/pagination.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import * as orderService from "../services/orderService.js";

/**
 * POST /api/orders — buyer only.
 *
 * Accepts either an explicit item list or `fromCart: true`. Either way the
 * prices, subtotals, delivery fees and total are computed from the product
 * documents in orderService; nothing financial is read from the request.
 */
export const createOrder = asyncHandler(async (req, res) => {
  let items = req.body.items;

  if (req.body.fromCart || !items?.length) {
    const cart = await Cart.findOne({ buyer: req.user._id }).lean();
    items = (cart?.items ?? []).map((item) => ({
      product: item.product,
      quantity: item.quantity,
    }));
  }

  if (!items.length) {
    throw ApiError.badRequest("Your cart is empty", "CART_EMPTY");
  }

  const order = await orderService.createOrder({
    buyer: req.user,
    items,
    shippingAddress: req.body.shippingAddress,
    paymentMethod: req.body.paymentMethod,
    notes: req.body.notes,
  });

  return created(res, {
    message: `Order ${order.orderNumber} placed`,
    data: order,
  });
});

/** GET /api/orders — the buyer's own orders. Never anyone else's. */
export const listMyOrders = asyncHandler(async (req, res) => {
  const query = getQuery(req);
  const { page, limit, skip } = readPageParams(query);

  const filter = { buyer: req.user._id };
  if (query.status) filter.orderStatus = query.status;
  if (query.search) filter.orderNumber = new RegExp(query.search.replace(/[^\w-]/g, ""), "i");

  const sort = query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

  const [data, total] = await Promise.all([
    Order.find(filter)
      .populate("subOrders.farmer", "name avatar")
      .sort(sort)
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

/** GET /api/orders/:id — the buyer's own order, or admin. */
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("buyer", "name email phone")
    .populate("subOrders.farmer", "name avatar location")
    .populate("subOrders.items.product", "name slug images");

  if (!order) throw ApiError.notFound("That order does not exist", "ORDER_NOT_FOUND");

  const isOwner = String(order.buyer._id) === String(req.user._id);
  if (!isOwner && !isAdmin(req.user)) {
    throw ApiError.forbidden("That order is not yours", "NOT_ORDER_OWNER");
  }

  return ok(res, { message: "Order loaded", data: order });
});

/** PATCH /api/orders/:id/cancel — buyer only, and only before preparation. */
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound("That order does not exist", "ORDER_NOT_FOUND");

  if (String(order.buyer) !== String(req.user._id)) {
    throw ApiError.forbidden("That order is not yours", "NOT_ORDER_OWNER");
  }

  await orderService.cancelOrderByBuyer({
    order,
    reason: req.body.reason,
    actor: req.user,
  });

  return ok(res, { message: "Order cancelled", data: order });
});

/* ------------------------------------------------------------------ *
 * Farmer side
 * ------------------------------------------------------------------ */

/**
 * GET /api/farmer/orders
 *
 * The filter matches on `subOrders.farmer`, and every result is projected
 * down to this farmer's own slice before it leaves the server — another
 * farmer's items and totals are never in the payload.
 */
export const listFarmerOrders = asyncHandler(async (req, res) => {
  const query = getQuery(req);
  const { page, limit, skip } = readPageParams(query);

  const filter = { "subOrders.farmer": req.user._id };
  if (query.status) filter["subOrders.status"] = query.status;
  if (query.search) filter.orderNumber = new RegExp(query.search.replace(/[^\w-]/g, ""), "i");

  const sort = query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("buyer", "name avatar location")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  const data = orders.map((order) => orderService.projectForFarmer(order, req.user._id));

  return paginated(res, {
    message: "Orders loaded",
    data,
    pagination: buildPagination({ page, limit, total }),
  });
});

/** GET /api/farmer/orders/:id — projected to this farmer's slice. */
export const getFarmerOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    "subOrders.farmer": req.user._id,
  })
    .populate("buyer", "name avatar location phone")
    .populate("subOrders.items.product", "name slug images");

  if (!order) throw ApiError.notFound("That order does not exist", "ORDER_NOT_FOUND");

  return ok(res, {
    message: "Order loaded",
    data: orderService.projectForFarmer(order, req.user._id),
  });
});

/**
 * PATCH /api/farmer/orders/:id/status
 *
 * The transition table in constants.js decides what is legal. A farmer
 * cannot jump PLACED straight to DELIVERED, and can only touch the
 * sub-order carrying their own id.
 */
export const updateFarmerOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    "subOrders.farmer": req.user._id,
  });

  if (!order) throw ApiError.notFound("That order does not exist", "ORDER_NOT_FOUND");

  await orderService.advanceSubOrder({
    order,
    farmerId: req.user._id,
    status: req.body.status,
    note: req.body.note,
    actor: req.user,
  });

  return ok(res, {
    message: `Order marked ${req.body.status.toLowerCase().replace(/_/g, " ")}`,
    data: orderService.projectForFarmer(order, req.user._id),
  });
});
