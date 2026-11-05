import { z } from "zod";
import { phone, name, shortText, pincode, paginationQuery } from "./common.js";
import { FARM_TYPES, AREA_UNITS, ROLES } from "../utils/constants.js";

/* .strict() rejects unknown keys outright, so a client cannot smuggle
   `role`, `isActive` or `password` into a profile update. */
export const updateMeSchema = z
  .object({
    name: name.optional(),
    phone: phone.optional(),
    location: shortText(120).optional(),
  })
  .strict();

export const addressSchema = z.object({
  label: shortText(40).optional(),
  line1: z.string().trim().min(4).max(160),
  city: z.string().trim().min(2).max(80),
  district: shortText(80).optional(),
  state: z.string().trim().min(2).max(80),
  pincode,
});

export const updateFarmSchema = z.object({
  farmName: z.string().trim().min(2).max(120).optional(),
  description: shortText(2000).optional(),
  location: z.string().trim().min(2).max(160).optional(),
  address: shortText(200).optional(),
  state: shortText(80).optional(),
  district: shortText(80).optional(),
  pincode: pincode.optional(),
  farmType: z.enum(FARM_TYPES).optional(),
  totalArea: z.coerce.number().min(0).max(100000).optional(),
  areaUnit: z.enum(AREA_UNITS).optional(),
  crops: z.array(z.string().trim().max(60)).max(30).optional(),
});

export const updateBuyerSchema = z.object({
  businessName: z.string().trim().min(2).max(120).optional(),
  businessType: shortText(80).optional(),
  gstin: shortText(20).optional(),
});

export const listUsersQuery = z.object({
  ...paginationQuery,
  role: z.enum([ROLES.FARMER, ROLES.BUYER, ROLES.ADMIN]).optional(),
  search: shortText(80).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  sort: z.enum(["newest", "oldest", "name"]).optional().default("newest"),
});
