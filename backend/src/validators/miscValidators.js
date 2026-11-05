import { z } from "zod";
import { objectId, shortText, paginationQuery } from "./common.js";
import {
  REPORT_TARGET,
  REPORT_STATUS,
  VERIFICATION_STATUS,
} from "../utils/constants.js";

/* ---------------- Cart ---------------- */

export const addCartItemSchema = z.object({
  product: objectId,
  quantity: z.coerce.number().int().positive("Quantity must be at least 1").max(100000),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().positive("Quantity must be at least 1").max(100000),
});

export const productIdParam = z.object({ productId: objectId });

/* ---------------- Categories ---------------- */

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Enter a category name").max(60),
  description: shortText(400).optional(),
  icon: shortText(60).optional(),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  isActive: z.boolean().optional(),
});

/* ---------------- Reviews ---------------- */

export const createReviewSchema = z.object({
  product: objectId,
  order: objectId,
  rating: z.coerce.number().int().min(1, "Rate from 1 to 5").max(5, "Rate from 1 to 5"),
  comment: z.string().trim().min(3, "Write at least a few words").max(1500).optional(),
});

export const updateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  comment: z.string().trim().min(3).max(1500).optional(),
});

export const listReviewsQuery = z.object({
  ...paginationQuery,
  rating: z.coerce.number().int().min(1).max(5).optional(),
  sort: z.enum(["newest", "oldest", "rating_high", "rating_low"]).optional().default("newest"),
});

/* ---------------- Messages ---------------- */

export const startConversationSchema = z.object({
  participant: objectId,
  product: objectId.optional(),
  message: z.string().trim().min(1, "Write a message").max(2000).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1, "Write a message").max(2000),
});

/* ---------------- Notifications ---------------- */

export const listNotificationsQuery = z.object({
  ...paginationQuery,
  isRead: z.enum(["true", "false"]).optional(),
});

/* ---------------- Reports ---------------- */

export const createReportSchema = z.object({
  targetType: z.enum(Object.values(REPORT_TARGET)),
  targetId: objectId,
  reason: z.string().trim().min(3, "Give a short reason").max(120),
  description: shortText(1500).optional(),
});

export const resolveReportSchema = z.object({
  status: z.enum(Object.values(REPORT_STATUS)),
  resolution: shortText(700).optional(),
});

export const listReportsQuery = z.object({
  ...paginationQuery,
  status: z.enum(Object.values(REPORT_STATUS)).optional(),
  targetType: z.enum(Object.values(REPORT_TARGET)).optional(),
});

/* ---------------- Admin ---------------- */

export const moderateFarmerSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  note: shortText(500).optional(),
});

export const suspendUserSchema = z.object({
  isActive: z.boolean(),
  reason: shortText(300).optional(),
});

export const listFarmsQuery = z.object({
  ...paginationQuery,
  verificationStatus: z.enum(Object.values(VERIFICATION_STATUS)).optional(),
  search: shortText(80).optional(),
  state: shortText(80).optional(),
});

export const adminOrdersQuery = z.object({
  ...paginationQuery,
  status: z.string().trim().max(30).optional(),
  search: shortText(60).optional(),
});
