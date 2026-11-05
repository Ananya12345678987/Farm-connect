import mongoose from "mongoose";
import { REPORT_TARGET, REPORT_STATUS } from "../utils/constants.js";

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    targetType: { type: String, enum: Object.values(REPORT_TARGET), required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },

    reason: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1500 },

    status: {
      type: String,
      enum: Object.values(REPORT_STATUS),
      default: REPORT_STATUS.PENDING,
      index: true,
    },
    resolution: { type: String, trim: true, maxlength: 700 },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    handledAt: { type: Date },
  },
  { timestamps: true }
);

/* One open report per person per target; a resolved one may be raised again. */
reportSchema.index(
  { reporter: 1, targetType: 1, targetId: 1, status: 1 },
  { partialFilterExpression: { status: { $in: ["PENDING", "REVIEWING"] } }, unique: true }
);
reportSchema.index({ targetType: 1, targetId: 1 });

export default mongoose.model("Report", reportSchema);
