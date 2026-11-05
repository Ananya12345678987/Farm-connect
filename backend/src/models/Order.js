import mongoose from "mongoose";
import {
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  ORDER_PROGRESSION,
  UNITS,
} from "../utils/constants.js";

/**
 * An order is one buyer checkout, split into one sub-order per farmer.
 *
 * Grouping this way means a farmer can be handed exactly their own slice —
 * their items, their subtotal, their status — without a query ever exposing
 * another farmer's portion of the same basket. The parent `orderStatus` is
 * derived from the sub-orders, never set directly.
 *
 * Item fields are snapshots. If a farmer renames a product or changes its
 * price tomorrow, this order still says what was actually bought and at what
 * rate, which is the difference between a record and a guess.
 */

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    nameSnapshot: { type: String, required: true },
    priceSnapshot: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: UNITS, required: true },
    imageSnapshot: { type: String, default: "" },

    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const statusEntrySchema = new mongoose.Schema(
  {
    status: { type: String, enum: Object.values(ORDER_STATUS), required: true },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    note: { type: String, trim: true, maxlength: 300 },
  },
  { _id: false }
);

const subOrderSchema = new mongoose.Schema(
  {
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm" },
    items: { type: [orderItemSchema], required: true },

    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PLACED,
    },
    statusHistory: { type: [statusEntrySchema], default: [] },
    cancelledReason: { type: String, trim: true, maxlength: 300 },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: true }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, match: /^[6-9]\d{9}$/ },
    line1: { type: String, required: true, trim: true, maxlength: 160 },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    district: { type: String, trim: true, maxlength: 80 },
    state: { type: String, required: true, trim: true, maxlength: 80 },
    pincode: { type: String, required: true, match: /^[1-9]\d{5}$/ },
    landmark: { type: String, trim: true, maxlength: 120 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, index: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    subOrders: { type: [subOrderSchema], required: true },

    shippingAddress: { type: shippingAddressSchema, required: true },
    notes: { type: String, trim: true, maxlength: 400 },

    /* All money is computed server-side from product documents. Nothing the
       client sends about price or total is ever read. */
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      default: PAYMENT_METHOD.COD,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    /** Reserved for a provider such as Razorpay. See services/paymentService. */
    paymentReference: { type: String, trim: true },

    orderStatus: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PLACED,
      index: true,
    },

    placedAt: { type: Date, default: Date.now },
    deliveredAt: { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ "subOrders.farmer": 1, createdAt: -1 });
orderSchema.index({ "subOrders.status": 1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });

/** Flat view of every item, for the buyer's own order detail. */
orderSchema.virtual("items").get(function items() {
  return this.subOrders.flatMap((sub) => sub.items);
});

/**
 * The parent status is the least-progressed sub-order, so a two-farmer order
 * only reads DELIVERED once both halves have arrived. If every sub-order is
 * cancelled, so is the order.
 */
orderSchema.methods.syncStatus = function syncStatus() {
  const live = this.subOrders.filter((sub) => sub.status !== ORDER_STATUS.CANCELLED);

  if (!live.length) {
    this.orderStatus = ORDER_STATUS.CANCELLED;
    return this.orderStatus;
  }

  const lowest = live.reduce((min, sub) => {
    const index = ORDER_PROGRESSION.indexOf(sub.status);
    return index < min ? index : min;
  }, ORDER_PROGRESSION.length - 1);

  this.orderStatus = ORDER_PROGRESSION[lowest];
  if (this.orderStatus === ORDER_STATUS.DELIVERED && !this.deliveredAt) {
    this.deliveredAt = new Date();
  }
  return this.orderStatus;
};

orderSchema.pre("validate", function setOrderNumber(next) {
  if (!this.orderNumber) {
    const stamp = Date.now().toString(36).toUpperCase().slice(-6);
    const rand = Math.floor(Math.random() * 46656).toString(36).toUpperCase().padStart(3, "0");
    this.orderNumber = `FC-${stamp}${rand}`;
  }
  next();
});

export default mongoose.model("Order", orderSchema);
