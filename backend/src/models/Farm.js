import mongoose from "mongoose";
import { VERIFICATION_STATUS, FARM_TYPES, AREA_UNITS } from "../utils/constants.js";

/**
 * A farmer's farm. Separate from User because it carries the verification
 * workflow, is queried and filtered on its own, and only exists for one role.
 */

const farmSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    farmName: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000 },

    location: { type: String, required: true, trim: true, maxlength: 160 },
    address: { type: String, trim: true, maxlength: 200 },
    state: { type: String, trim: true, maxlength: 80 },
    district: { type: String, trim: true, maxlength: 80 },
    pincode: { type: String, trim: true, match: /^[1-9]\d{5}$/ },

    farmType: { type: String, enum: FARM_TYPES, default: "MIXED" },
    totalArea: { type: Number, min: 0, max: 100000 },
    areaUnit: { type: String, enum: AREA_UNITS, default: "acre" },
    crops: { type: [String], default: [] },

    isVerified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.PENDING,
      index: true,
    },
    verificationNote: { type: String, trim: true, maxlength: 500 },
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    /* Denormalised so a marketplace card does not need an aggregate. */
    productCount: { type: Number, default: 0, min: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

farmSchema.index({ state: 1, district: 1 });
farmSchema.index({ farmName: "text", location: "text", description: "text" });

farmSchema.pre("save", function syncVerified(next) {
  this.isVerified = this.verificationStatus === VERIFICATION_STATUS.APPROVED;
  next();
});

export default mongoose.model("Farm", farmSchema);
