import { z } from "zod";
import { email, password, phone, name, shortText } from "./common.js";
import { FARM_TYPES, AREA_UNITS } from "../utils/constants.js";

/* Note what is absent from every one of these: `role`. Each registration
   route sets the role itself, so it cannot be supplied by a client. */

export const farmerRegisterSchema = z.object({
  fullName: name,
  email,
  phone,
  password,
  farmName: z.string().trim().min(2, "Enter your farm name").max(120),
  location: z.string().trim().min(2, "Enter your location").max(160),
  farmType: z.enum(FARM_TYPES).optional().default("MIXED"),
  state: shortText(80).optional(),
  district: shortText(80).optional(),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/).optional(),
  totalArea: z.coerce.number().min(0).max(100000).optional(),
  areaUnit: z.enum(AREA_UNITS).optional().default("acre"),
  description: shortText(2000).optional(),
});

export const buyerRegisterSchema = z.object({
  fullName: name,
  email,
  phone,
  password,
  businessName: z.string().trim().min(2, "Enter your business name").max(120),
  location: z.string().trim().min(2, "Enter your location").max(160),
  businessType: shortText(80).optional(),
});

export const adminRegisterSchema = z.object({
  fullName: name,
  email,
  password,
  adminCode: z.string().min(6, "Enter the administrator code").max(200),
});

export const loginSchema = z.object({
  email,
  /* Deliberately not the strict password rule: an old account with a weaker
     password must still be able to log in and change it. */
  password: z.string().min(1, "Enter your password").max(128),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: password,
});
