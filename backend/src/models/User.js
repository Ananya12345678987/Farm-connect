import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import env from "../config/env.js";
import { ROLES } from "../utils/constants.js";

/**
 * One User collection for all three roles.
 *
 * Splitting farmers, buyers and admins into separate collections would mean
 * three login paths, three token shapes and three places to get authorisation
 * wrong. Role-specific data lives alongside: farm details in the Farm model,
 * buyer business details in an embedded sub-document here because they are
 * few and never queried on their own.
 */

const buyerProfileSchema = new mongoose.Schema(
  {
    businessName: { type: String, trim: true, maxlength: 120 },
    businessType: { type: String, trim: true, maxlength: 80 },
    gstin: { type: String, trim: true, maxlength: 20 },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, maxlength: 40 },
    line1: { type: String, trim: true, maxlength: 160 },
    city: { type: String, trim: true, maxlength: 80 },
    district: { type: String, trim: true, maxlength: 80 },
    state: { type: String, trim: true, maxlength: 80 },
    pincode: { type: String, trim: true, match: /^[1-9]\d{5}$/ },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Enter a valid email address"],
    },

    phone: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"],
    },

    /* select:false means a plain find() can never leak the hash, even if a
       controller forgets to project it away. */
    password: { type: String, required: true, minlength: 8, select: false },

    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
      default: ROLES.BUYER,
    },

    avatar: {
      url: { type: String, trim: true },
      publicId: { type: String, trim: true },
    },

    location: { type: String, trim: true, maxlength: 120 },
    addresses: { type: [addressSchema], default: [] },

    buyerProfile: { type: buyerProfileSchema, default: undefined },

    /** Set false to suspend. Suspended users can authenticate no further. */
    isActive: { type: Boolean, default: true },

    /** Email/phone confirmation. Farmers additionally need farm approval. */
    isVerified: { type: Boolean, default: false },

    suspendedReason: { type: String, trim: true, maxlength: 300 },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

/* email already has a unique index from the field definition. */
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ name: "text", email: "text" });

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, env.bcryptRounds);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

/** The projection safe to send to any authenticated client. */
userSchema.statics.publicFields = "name email phone role avatar location isActive isVerified createdAt";

/** The narrower projection safe to expose publicly (e.g. a farmer profile). */
userSchema.statics.openFields = "name avatar location role createdAt";

export default mongoose.model("User", userSchema);
