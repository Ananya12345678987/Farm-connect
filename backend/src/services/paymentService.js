import { PAYMENT_METHOD, PAYMENT_STATUS } from "../utils/constants.js";
import ApiError from "../utils/ApiError.js";

/**
 * Payment abstraction.
 *
 * The project runs cash-on-delivery today, but the order controller must not
 * know that. It calls `preparePayment` before creating an order and
 * `settle` when money is confirmed; adding Razorpay later means writing a
 * second provider object here and switching on `method` — no order logic
 * changes.
 */

const codProvider = {
  method: PAYMENT_METHOD.COD,

  async prepare() {
    /* Nothing to authorise up front; the courier collects. */
    return { paymentStatus: PAYMENT_STATUS.PENDING, paymentReference: null };
  },

  async settle() {
    return { paymentStatus: PAYMENT_STATUS.PAID };
  },

  async refund() {
    return { paymentStatus: PAYMENT_STATUS.REFUNDED };
  },
};

const noneProvider = {
  method: PAYMENT_METHOD.NONE,
  async prepare() {
    return { paymentStatus: PAYMENT_STATUS.PENDING, paymentReference: null };
  },
  async settle() {
    return { paymentStatus: PAYMENT_STATUS.PAID };
  },
  async refund() {
    return { paymentStatus: PAYMENT_STATUS.REFUNDED };
  },
};

/*
 * When Razorpay is added:
 *
 * const razorpayProvider = {
 *   method: "RAZORPAY",
 *   async prepare({ amount, orderNumber }) {
 *     const order = await razorpay.orders.create({
 *       amount: amount * 100, currency: "INR", receipt: orderNumber,
 *     });
 *     return { paymentStatus: "PENDING", paymentReference: order.id };
 *   },
 *   async settle({ paymentReference, signature }) { ...verify... },
 * };
 */

const providers = {
  [PAYMENT_METHOD.COD]: codProvider,
  [PAYMENT_METHOD.NONE]: noneProvider,
};

export const getProvider = (method = PAYMENT_METHOD.COD) => {
  const provider = providers[method];
  if (!provider) {
    throw ApiError.badRequest(`Payment method ${method} is not supported`, "PAYMENT_UNSUPPORTED");
  }
  return provider;
};

export const preparePayment = (method, context) => getProvider(method).prepare(context);

export const settlePayment = (method, context) => getProvider(method).settle(context);

export const refundPayment = (method, context) => getProvider(method).refund(context);

export const supportedMethods = () => Object.keys(providers);
