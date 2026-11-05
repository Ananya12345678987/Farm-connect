import mongoose from "mongoose";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Farm from "../models/Farm.js";
import ApiError from "../utils/ApiError.js";
import logger from "../utils/logger.js";
import { supportsTransactions } from "../config/db.js";
import { preparePayment } from "./paymentService.js";
import { createNotification, emitPending } from "./notificationService.js";
import { orderUpdated } from "./socketService.js";
import {
  APPROVAL_STATUS,
  AVAILABILITY,
  LOW_STOCK_THRESHOLD,
  DELIVERY_FEE_PER_FARMER,
  FREE_DELIVERY_THRESHOLD,
  NOTIFICATION_TYPE,
  ORDER_STATUS,
  ORDER_TRANSITIONS,
  BUYER_CANCELLABLE,
  FARMER_SETTABLE,
} from "../utils/constants.js";

/**
 * Order creation, inventory and status transitions.
 *
 * Nothing about money or ownership comes from the request. The client sends
 * product ids and quantities; every price, subtotal, delivery fee and total
 * is read from the database and computed here.
 */

/* ------------------------------------------------------------------ *
 * Inventory
 * ------------------------------------------------------------------ */

/**
 * Atomic decrement. The `quantity: { $gte: n }` guard is inside the filter,
 * so two buyers racing for the last crate cannot both succeed — the second
 * update matches nothing and returns null. A read-then-write would let both
 * through and drive stock negative.
 */
const decrementStock = async (productId, amount, session) => {
  const updated = await Product.findOneAndUpdate(
    { _id: productId, quantity: { $gte: amount }, approvalStatus: APPROVAL_STATUS.APPROVED, isActive: true },
    [
      {
        $set: {
          quantity: { $subtract: ["$quantity", amount] },
        },
      },
      {
        $set: {
          availability: {
            $switch: {
              branches: [
                { case: { $lte: ["$quantity", 0] }, then: AVAILABILITY.OUT_OF_STOCK },
                { case: { $lte: ["$quantity", LOW_STOCK_THRESHOLD] }, then: AVAILABILITY.LOW_STOCK },
              ],
              default: AVAILABILITY.AVAILABLE,
            },
          },
          soldCount: { $add: ["$soldCount", amount] },
        },
      },
    ],
    { new: true, session }
  );

  return updated;
};

/** Puts stock back when an order or sub-order is cancelled. */
const restoreStock = async (items, session) => {
  await Promise.all(
    items.map(async (item) => {
      await Product.findOneAndUpdate(
        { _id: item.product },
        [
          { $set: { quantity: { $add: ["$quantity", item.quantity] } } },
          {
            $set: {
              availability: {
                $switch: {
                  branches: [
                    { case: { $lte: ["$quantity", 0] }, then: AVAILABILITY.OUT_OF_STOCK },
                    { case: { $lte: ["$quantity", LOW_STOCK_THRESHOLD] }, then: AVAILABILITY.LOW_STOCK },
                  ],
                  default: AVAILABILITY.AVAILABLE,
                },
              },
              soldCount: { $max: [0, { $subtract: ["$soldCount", item.quantity] }] },
            },
          },
        ],
        { session }
      );
    })
  );
};

/* ------------------------------------------------------------------ *
 * Pricing
 * ------------------------------------------------------------------ */

/**
 * Loads every product, checks it is buyable, and builds the priced
 * sub-orders. Throws on the first problem with a message naming the item,
 * because "one of your items is unavailable" is useless in a checkout.
 */
export const buildOrderDraft = async (requestedItems, session) => {
  const ids = requestedItems.map((item) => item.product);

  const products = await Product.find({ _id: { $in: ids } })
    .select("name price unit quantity images farmer farm approvalStatus isActive")
    .session(session ?? null)
    .lean();

  const byId = new Map(products.map((product) => [String(product._id), product]));
  const byFarmer = new Map();

  for (const requested of requestedItems) {
    const product = byId.get(String(requested.product));

    if (!product) {
      throw ApiError.notFound("One of the items is no longer listed", "PRODUCT_NOT_FOUND");
    }
    if (product.approvalStatus !== APPROVAL_STATUS.APPROVED) {
      throw ApiError.badRequest(`"${product.name}" is not approved for sale`, "PRODUCT_NOT_APPROVED");
    }
    if (!product.isActive) {
      throw ApiError.badRequest(`"${product.name}" is no longer available`, "PRODUCT_INACTIVE");
    }
    if (product.quantity < requested.quantity) {
      throw ApiError.conflict(
        `Only ${product.quantity} ${product.unit} of "${product.name}" remain`,
        "INSUFFICIENT_STOCK"
      );
    }

    const farmerId = String(product.farmer);
    const subtotal = Math.round(product.price * requested.quantity * 100) / 100;

    const item = {
      product: product._id,
      farmer: product.farmer,
      nameSnapshot: product.name,
      priceSnapshot: product.price,
      unit: product.unit,
      imageSnapshot: product.images?.[0]?.url ?? "",
      quantity: requested.quantity,
      subtotal,
    };

    if (!byFarmer.has(farmerId)) {
      byFarmer.set(farmerId, { farmer: product.farmer, farm: product.farm, items: [], subtotal: 0 });
    }
    const group = byFarmer.get(farmerId);
    group.items.push(item);
    group.subtotal += subtotal;
  }

  const subOrders = [...byFarmer.values()].map((group) => {
    const deliveryFee =
      group.subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE_PER_FARMER;
    return {
      farmer: group.farmer,
      farm: group.farm,
      items: group.items,
      subtotal: Math.round(group.subtotal * 100) / 100,
      deliveryFee,
      total: Math.round((group.subtotal + deliveryFee) * 100) / 100,
      status: ORDER_STATUS.PLACED,
      statusHistory: [{ status: ORDER_STATUS.PLACED, at: new Date() }],
    };
  });

  const subtotal = subOrders.reduce((sum, sub) => sum + sub.subtotal, 0);
  const deliveryFee = subOrders.reduce((sum, sub) => sum + sub.deliveryFee, 0);

  return {
    subOrders,
    subtotal: Math.round(subtotal * 100) / 100,
    deliveryFee: Math.round(deliveryFee * 100) / 100,
    totalAmount: Math.round((subtotal + deliveryFee) * 100) / 100,
  };
};

/* ------------------------------------------------------------------ *
 * Creation
 * ------------------------------------------------------------------ */

const buildOrderNotifications = (order, buyer) => {
  const notifications = [
    {
      recipient: buyer._id,
      type: NOTIFICATION_TYPE.ORDER_PLACED,
      title: `Order ${order.orderNumber} placed`,
      message: `We have sent your order to ${order.subOrders.length} farm${
        order.subOrders.length > 1 ? "s" : ""
      }. You will be notified as it is confirmed.`,
      relatedEntity: { kind: "Order", id: order._id },
      link: "/buyer-dashboard",
    },
  ];

  order.subOrders.forEach((sub) => {
    notifications.push({
      recipient: sub.farmer,
      type: NOTIFICATION_TYPE.NEW_ORDER,
      title: `New order ${order.orderNumber}`,
      message: `${sub.items.length} item${sub.items.length > 1 ? "s" : ""} worth ₹${sub.total}. Confirm it to begin.`,
      relatedEntity: { kind: "Order", id: order._id },
      link: "/farmer-dashboard",
    });
  });

  return notifications;
};

const persistOrder = async ({ buyer, draft, shippingAddress, paymentMethod, notes, session }) => {
  /* Decrement first: if any item has just sold out, nothing has been
     written yet and the whole attempt aborts cleanly. */
  const decremented = [];

  for (const sub of draft.subOrders) {
    for (const item of sub.items) {
      // eslint-disable-next-line no-await-in-loop
      const updated = await decrementStock(item.product, item.quantity, session);
      if (!updated) {
        throw ApiError.conflict(
          `"${item.nameSnapshot}" sold out while you were checking out`,
          "INSUFFICIENT_STOCK"
        );
      }
      decremented.push(item);
    }
  }

  const payment = await preparePayment(paymentMethod, {
    amount: draft.totalAmount,
  });

  const [order] = await Order.create(
    [
      {
        buyer: buyer._id,
        subOrders: draft.subOrders,
        shippingAddress,
        notes,
        subtotal: draft.subtotal,
        deliveryFee: draft.deliveryFee,
        totalAmount: draft.totalAmount,
        paymentMethod,
        paymentStatus: payment.paymentStatus,
        paymentReference: payment.paymentReference,
        orderStatus: ORDER_STATUS.PLACED,
      },
    ],
    session ? { session } : {}
  );

  return { order, decremented };
};

/**
 * Creates the order, empties the cart, decrements inventory and writes
 * notifications as one unit.
 *
 * With a replica set this runs in a real transaction. On a standalone mongod
 * transactions are unavailable, so the same steps run with an explicit
 * compensating rollback — stock is put back if the order write fails. The
 * fallback is weaker than a transaction and says so in the log; it is not
 * pretending to be equivalent.
 */
export const createOrder = async ({ buyer, items, shippingAddress, paymentMethod, notes }) => {
  if (supportsTransactions()) {
    const session = await mongoose.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        const draft = await buildOrderDraft(items, session);
        const { order } = await persistOrder({
          buyer,
          draft,
          shippingAddress,
          paymentMethod,
          notes,
          session,
        });

        await Cart.findOneAndUpdate({ buyer: buyer._id }, { items: [] }, { session });

        const notifications = buildOrderNotifications(order, buyer);
        const docs = [];
        for (const notification of notifications) {
          // eslint-disable-next-line no-await-in-loop
          docs.push(await createNotification({ ...notification, session }));
        }

        result = { order, notificationDocs: docs };
      });

      /* Emitted after commit — before it, no one else can see the rows. */
      emitPending(result.notificationDocs);
      result.order.subOrders.forEach((sub) =>
        orderUpdated(sub.farmer, { orderId: result.order._id, orderNumber: result.order.orderNumber, status: sub.status })
      );

      return result.order;
    } finally {
      await session.endSession();
    }
  }

  /* --- Compensating path, standalone MongoDB --- */
  const draft = await buildOrderDraft(items);
  /* If this throws, nothing has been written that needs undoing: stock is
     only decremented inside persistOrder, which rolls its own work back. */
  const created = await persistOrder({ buyer, draft, shippingAddress, paymentMethod, notes });

  try {
    await Cart.findOneAndUpdate({ buyer: buyer._id }, { items: [] });
    for (const notification of buildOrderNotifications(created.order, buyer)) {
      // eslint-disable-next-line no-await-in-loop
      await createNotification(notification);
    }
    created.order.subOrders.forEach((sub) =>
      orderUpdated(sub.farmer, {
        orderId: created.order._id,
        orderNumber: created.order.orderNumber,
        status: sub.status,
      })
    );
  } catch (error) {
    logger.error("Post-order steps failed; rolling back inventory", { message: error.message });
    await restoreStock(created.decremented);
    await Order.deleteOne({ _id: created.order._id });
    throw ApiError.unavailable("Could not complete your order. Nothing was charged.", "ORDER_FAILED");
  }

  return created.order;
};

/* ------------------------------------------------------------------ *
 * Status transitions
 * ------------------------------------------------------------------ */

export const assertTransition = (from, to) => {
  const allowed = ORDER_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw ApiError.badRequest(
      `An order at ${from} cannot move to ${to}`,
      "INVALID_STATUS_TRANSITION"
    );
  }
};

/** Farmer moves their own portion forward. Ownership is checked against the
 *  sub-order's farmer field, so another farmer's slice is unreachable. */
export const advanceSubOrder = async ({ order, farmerId, status, note, actor }) => {
  const sub = order.subOrders.find((item) => String(item.farmer) === String(farmerId));

  if (!sub) {
    throw ApiError.forbidden("You have no items in this order", "NOT_ORDER_FARMER");
  }
  if (!FARMER_SETTABLE.includes(status)) {
    throw ApiError.badRequest(`You cannot set an order to ${status}`, "STATUS_NOT_ALLOWED");
  }

  assertTransition(sub.status, status);

  if (status === ORDER_STATUS.CANCELLED) {
    await restoreStock(sub.items);
    sub.cancelledReason = note ?? "Cancelled by the farm";
    sub.cancelledBy = actor._id;
  }

  sub.status = status;
  sub.statusHistory.push({ status, at: new Date(), by: actor._id, note });

  order.syncStatus();
  await order.save();

  await createNotification({
    recipient: order.buyer,
    type:
      status === ORDER_STATUS.CANCELLED
        ? NOTIFICATION_TYPE.ORDER_CANCELLED
        : NOTIFICATION_TYPE.ORDER_STATUS_CHANGED,
    title: `Order ${order.orderNumber} is ${status.toLowerCase().replace(/_/g, " ")}`,
    message:
      status === ORDER_STATUS.CANCELLED
        ? `Part of your order was cancelled by the farm. ${note ?? ""}`.trim()
        : `Your order from one of the farms is now ${status.toLowerCase().replace(/_/g, " ")}.`,
    relatedEntity: { kind: "Order", id: order._id },
    link: "/buyer-dashboard",
  });

  orderUpdated(order.buyer, {
    orderId: order._id,
    orderNumber: order.orderNumber,
    subOrderId: sub._id,
    status,
    orderStatus: order.orderStatus,
  });

  return order;
};

/** Buyer cancels. Only their own order, and only while nothing has shipped. */
export const cancelOrderByBuyer = async ({ order, reason, actor }) => {
  const cancellable = order.subOrders.filter((sub) => BUYER_CANCELLABLE.includes(sub.status));

  if (!cancellable.length) {
    throw ApiError.badRequest(
      "This order has already been prepared and can no longer be cancelled",
      "ORDER_NOT_CANCELLABLE"
    );
  }

  for (const sub of cancellable) {
    // eslint-disable-next-line no-await-in-loop
    await restoreStock(sub.items);
    sub.status = ORDER_STATUS.CANCELLED;
    sub.cancelledReason = reason ?? "Cancelled by the buyer";
    sub.cancelledBy = actor._id;
    sub.statusHistory.push({
      status: ORDER_STATUS.CANCELLED,
      at: new Date(),
      by: actor._id,
      note: reason,
    });
  }

  order.syncStatus();
  await order.save();

  for (const sub of cancellable) {
    // eslint-disable-next-line no-await-in-loop
    await createNotification({
      recipient: sub.farmer,
      type: NOTIFICATION_TYPE.ORDER_CANCELLED,
      title: `Order ${order.orderNumber} cancelled`,
      message: `The buyer cancelled their order. Stock has been returned to your listings.`,
      relatedEntity: { kind: "Order", id: order._id },
      link: "/farmer-dashboard",
    });
    orderUpdated(sub.farmer, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: ORDER_STATUS.CANCELLED,
    });
  }

  return order;
};

/** Projects an order down to one farmer's slice. */
export const projectForFarmer = (order, farmerId) => {
  const plain = typeof order.toObject === "function" ? order.toObject() : order;
  const sub = plain.subOrders.find((item) => String(item.farmer) === String(farmerId));

  return {
    _id: plain._id,
    orderNumber: plain.orderNumber,
    buyer: plain.buyer,
    shippingAddress: plain.shippingAddress,
    paymentMethod: plain.paymentMethod,
    paymentStatus: plain.paymentStatus,
    placedAt: plain.placedAt,
    createdAt: plain.createdAt,
    /* Only this farmer's portion. Another farmer's items, totals and status
       are not in the response at all. */
    subOrder: sub,
  };
};

export { restoreStock, decrementStock };
