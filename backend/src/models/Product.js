import mongoose from "mongoose";
import {
  APPROVAL_STATUS,
  AVAILABILITY,
  UNITS,
  LOW_STOCK_THRESHOLD,
} from "../utils/constants.js";
import { uniqueSlug } from "../utils/slugify.js";

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
    width: Number,
    height: Number,
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm" },

    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    slug: { type: String, unique: true, index: true },
    description: { type: String, trim: true, maxlength: 3000 },

    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },

    images: { type: [imageSchema], default: [] },

    price: { type: Number, required: true, min: 1, max: 10000000 },
    quantity: { type: Number, required: true, min: 0, max: 1000000 },
    unit: { type: String, enum: UNITS, required: true },

    location: { type: String, trim: true, maxlength: 160 },
    state: { type: String, trim: true, maxlength: 80 },
    district: { type: String, trim: true, maxlength: 80 },

    harvestDate: { type: Date },
    isOrganic: { type: Boolean, default: false },

    availability: {
      type: String,
      enum: Object.values(AVAILABILITY),
      default: AVAILABILITY.AVAILABLE,
    },

    approvalStatus: {
      type: String,
      enum: Object.values(APPROVAL_STATUS),
      default: APPROVAL_STATUS.PENDING,
      index: true,
    },
    rejectionReason: { type: String, trim: true, maxlength: 500 },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    /** The farmer's own switch. Distinct from approvalStatus, which is the
     *  admin's. A product is public only when both agree. */
    isActive: { type: Boolean, default: true },

    /* Stored aggregates. Recomputed by the review service when a review is
       written or removed, so listing pages never run a rating aggregate. */
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    soldCount: { type: Number, default: 0, min: 0 },
    viewCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

/* The marketplace's hot path: approved + active, filtered and sorted. */
productSchema.index({ approvalStatus: 1, isActive: 1, createdAt: -1 });
productSchema.index({ approvalStatus: 1, isActive: 1, category: 1, price: 1 });
productSchema.index({ approvalStatus: 1, isActive: 1, state: 1, district: 1 });
productSchema.index({ farmer: 1, createdAt: -1 });
productSchema.index(
  { name: "text", description: "text", location: "text" },
  { weights: { name: 10, description: 2, location: 3 }, name: "product_search" }
);

productSchema.pre("validate", function setSlug(next) {
  if (!this.slug) this.slug = uniqueSlug(this.name);
  next();
});

/** Availability is derived from quantity, never set by a client. */
productSchema.methods.syncAvailability = function syncAvailability() {
  if (this.quantity <= 0) this.availability = AVAILABILITY.OUT_OF_STOCK;
  else if (this.quantity <= LOW_STOCK_THRESHOLD) this.availability = AVAILABILITY.LOW_STOCK;
  else this.availability = AVAILABILITY.AVAILABLE;
  return this.availability;
};

productSchema.pre("save", function syncOnSave(next) {
  if (this.isModified("quantity")) this.syncAvailability();
  next();
});

/** Filter fragment for anything a buyer or the public may see. */
productSchema.statics.publicFilter = () => ({
  approvalStatus: APPROVAL_STATUS.APPROVED,
  isActive: true,
});

export default mongoose.model("Product", productSchema);
