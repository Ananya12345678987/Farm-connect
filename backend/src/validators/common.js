import { z } from "zod";
import mongoose from "mongoose";

/** Shared field primitives, so "what is a valid price" is defined once. */

export const objectId = z
  .string()
  .refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: "Not a valid id",
  });

export const idParam = z.object({ id: objectId });

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, "Enter a valid email address")
  .max(160)
  .email("Enter a valid email address");

export const password = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128, "That password is too long")
  .refine((value) => /[a-zA-Z]/.test(value) && /\d/.test(value), {
    message: "Include at least one letter and one number",
  });

export const phone = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, "").replace(/^\+91/, ""))
  .refine((value) => /^[6-9]\d{9}$/.test(value), {
    message: "Enter a 10-digit Indian mobile number",
  });

export const pincode = z
  .string()
  .trim()
  .regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode");

export const name = z.string().trim().min(2, "Enter a name").max(80);

export const shortText = (max = 200) => z.string().trim().max(max);

/** Query strings arrive as strings; these coerce and clamp them. */
export const intQuery = (min, max, fallback) =>
  z.coerce.number().int().min(min).max(max).optional().default(fallback);

export const boolQuery = z
  .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
  .transform((value) => value === true || value === "true" || value === "1")
  .optional();

export const paginationQuery = {
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(12),
};
