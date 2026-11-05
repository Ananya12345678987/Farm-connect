import { z } from "zod";
import { objectId, phone, pincode, shortText, paginationQuery } from "./common.js";
import { ORDER_STATUS, PAYMENT_METHOD, FARMER_SETTABLE } from "../utils/constants.js";

const shippingAddress = z.object({
  fullName: z.string().trim().min(2, "Enter a name for delivery").max(80),
  phone,
  line1: z.string().trim().min(4, "Enter the delivery address").max(160),
  city: z.string().trim().min(2, "Enter a city or town").max(80),
  district: shortText(80).optional(),
  state: z.string().trim().min(2, "Enter a state").max(80),
  pincode,
  landmark: shortText(120).optional(),
});

/* Note there is no `price` or `total` here. The client sends what it wants
   and how much; every rupee is computed server-side from the product. */
export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        product: objectId,
        quantity: z.coerce.number().int().positive("Quantity must be at least 1").max(100000),
      })
    )
    .min(1, "Your cart is empty")
    .max(50, "An order can contain at most 50 line items")
    .optional(),
  /* When true, the order is built from the server-side cart instead. */
  fromCart: z.boolean().optional().default(false),
  shippingAddress,
  paymentMethod: z.enum(Object.values(PAYMENT_METHOD)).optional().default(PAYMENT_METHOD.COD),
  notes: shortText(400).optional(),
});

export const listOrdersQuery = z.object({
  ...paginationQuery,
  status: z.enum(Object.values(ORDER_STATUS)).optional(),
  search: shortText(60).optional(),
  sort: z.enum(["newest", "oldest"]).optional().default("newest"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(FARMER_SETTABLE),
  note: shortText(300).optional(),
});

export const cancelOrderSchema = z.object({
  reason: shortText(300).optional(),
});
