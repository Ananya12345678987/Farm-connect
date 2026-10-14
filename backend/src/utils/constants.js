/**
 * Shared enums. Models, validators, services and the seed all read from here
 * so a status string is never spelled two different ways in two places.
 */

export const ROLES = { FARMER: "FARMER", BUYER: "BUYER", ADMIN: "ADMIN" };

export const VERIFICATION_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

export const APPROVAL_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

export const AVAILABILITY = {
  AVAILABLE: "AVAILABLE",
  LOW_STOCK: "LOW_STOCK",
  OUT_OF_STOCK: "OUT_OF_STOCK",
};

export const LOW_STOCK_THRESHOLD = 10;

export const ORDER_STATUS = {
  PLACED: "PLACED",
  CONFIRMED: "CONFIRMED",
  PROCESSING: "PROCESSING",
  READY: "READY",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
};

/** The only transitions the API will ever perform. */
export const ORDER_TRANSITIONS = {
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["READY", "CANCELLED"],
  READY: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

/** Order of progress, used to derive the parent order status. */
export const ORDER_PROGRESSION = [
  "PLACED",
  "CONFIRMED",
  "PROCESSING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

/** A buyer may only pull out before the farmer starts preparing. */
export const BUYER_CANCELLABLE = ["PLACED", "CONFIRMED"];

/** Statuses a farmer may set on their own portion of an order. */
export const FARMER_SETTABLE = [
  "CONFIRMED",
  "PROCESSING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

export const PAYMENT_METHOD = { COD: "COD", NONE: "NONE" };

export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
};

export const NOTIFICATION_TYPE = {
  FARMER_APPROVED: "FARMER_APPROVED",
  FARMER_REJECTED: "FARMER_REJECTED",
  PRODUCT_APPROVED: "PRODUCT_APPROVED",
  PRODUCT_REJECTED: "PRODUCT_REJECTED",
  PRODUCT_PENDING: "PRODUCT_PENDING",
  NEW_ORDER: "NEW_ORDER",
  ORDER_PLACED: "ORDER_PLACED",
  ORDER_STATUS_CHANGED: "ORDER_STATUS_CHANGED",
  ORDER_CANCELLED: "ORDER_CANCELLED",
  NEW_MESSAGE: "NEW_MESSAGE",
  NEW_REVIEW: "NEW_REVIEW",
  ACCOUNT_SUSPENDED: "ACCOUNT_SUSPENDED",
};

export const REPORT_TARGET = {
  PRODUCT: "PRODUCT",
  USER: "USER",
  REVIEW: "REVIEW",
  ORDER: "ORDER",
};

export const REPORT_STATUS = {
  PENDING: "PENDING",
  REVIEWING: "REVIEWING",
  RESOLVED: "RESOLVED",
  REJECTED: "REJECTED",
};

export const UNITS = [
  "kg",
  "g",
  "quintal",
  "tonne",
  "dozen",
  "piece",
  "litre",
  "bundle",
];

export const AREA_UNITS = ["acre", "hectare", "guntha", "bigha"];

export const FARM_TYPES = [
  "VEGETABLES",
  "FRUITS",
  "GRAINS",
  "PULSES",
  "SPICES",
  "DAIRY",
  "MIXED",
  "ORGANIC",
];

export const SOCKET_EVENTS = {
  NOTIFICATION_NEW: "notification:new",
  MESSAGE_NEW: "message:new",
  MESSAGE_READ: "message:read",
  ORDER_UPDATED: "order:updated",
  PRODUCT_APPROVED: "product:approved",
  FARMER_APPROVED: "farmer:approved",
};

/** Flat delivery fee per farmer portion, in rupees. Real logistics pricing
 *  would replace this; it is isolated here so that stays a one-line change. */
export const DELIVERY_FEE_PER_FARMER = 40;
export const FREE_DELIVERY_THRESHOLD = 2000;