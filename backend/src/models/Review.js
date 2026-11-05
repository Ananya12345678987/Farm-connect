import mongoose from "mongoose";

/**
 * A review is tied to a specific order item, not just a product. That is what
 * makes "only buyers who actually bought this may review it" enforceable, and
 * it lets a buyer who ordered the same product twice review it twice —
 * while the compound unique index stops them reviewing one purchase twice.
 */

const reviewSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },

    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1500 },

    isHidden: { type: Boolean, default: false },
    hiddenReason: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

reviewSchema.index({ buyer: 1, product: 1, order: 1 }, { unique: true });
reviewSchema.index({ product: 1, isHidden: 1, createdAt: -1 });

export default mongoose.model("Review", reviewSchema);
