import mongoose from "mongoose";
import { NOTIFICATION_TYPE } from "../utils/constants.js";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: Object.values(NOTIFICATION_TYPE), required: true },

    title: { type: String, required: true, trim: true, maxlength: 140 },
    message: { type: String, required: true, trim: true, maxlength: 500 },

    relatedEntity: {
      kind: { type: String, trim: true },
      id: { type: mongoose.Schema.Types.ObjectId },
    },
    /** Where the frontend should send the user when they tap it. */
    link: { type: String, trim: true, maxlength: 200 },

    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
