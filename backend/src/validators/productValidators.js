import { z } from "zod";
import { objectId, shortText, paginationQuery, boolQuery } from "./common.js";
import { UNITS, APPROVAL_STATUS, AVAILABILITY } from "../utils/constants.js";

/* Multipart bodies arrive as strings, so every numeric and boolean field is
   coerced rather than assumed. */

export const createProductSchema = z.object({
  name: z.string().trim().min(2, "Enter a product name").max(120),
  description: shortText(3000).optional(),
  category: objectId,
  price: z.coerce.number().positive("Price must be more than zero").max(10000000),
  quantity: z.coerce.number().int().min(0, "Quantity cannot be negative").max(1000000),
  unit: z.enum(UNITS, { errorMap: () => ({ message: `Unit must be one of: ${UNITS.join(", ")}` }) }),
  location: shortText(160).optional(),
  state: shortText(80).optional(),
  district: shortText(80).optional(),
  harvestDate: z.coerce
    .date()
    .max(new Date(Date.now() + 86400000), "Harvest date cannot be in the future")
    .optional(),
  isOrganic: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((v) => v === true || v === "true")
    .optional()
    .default(false),
});

export const updateProductSchema = createProductSchema.partial().extend({
  isActive: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((v) => v === true || v === "true")
    .optional(),
});

export const listProductsQuery = z.object({
  ...paginationQuery,
  search: shortText(120).optional(),
  category: z.string().trim().max(60).optional(),
  farmer: objectId.optional(),
  state: shortText(80).optional(),
  district: shortText(80).optional(),
  location: shortText(120).optional(),
  isOrganic: boolQuery,
  availability: z.enum(Object.values(AVAILABILITY)).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sort: z
    .enum(["newest", "oldest", "price_asc", "price_desc", "rating", "popular", "relevance"])
    .optional()
    .default("newest"),
});

export const myProductsQuery = z.object({
  ...paginationQuery,
  approvalStatus: z.enum(Object.values(APPROVAL_STATUS)).optional(),
  search: shortText(120).optional(),
  sort: z.enum(["newest", "oldest", "price_asc", "price_desc"]).optional().default("newest"),
});

export const moderateProductSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "ACTIVATE", "DEACTIVATE"]),
  reason: shortText(500).optional(),
});
