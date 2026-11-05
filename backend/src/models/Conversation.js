import mongoose from "mongoose";

/**
 * A one-to-one thread between a buyer and a farmer. `key` is the two
 * participant ids sorted and joined, with a unique index — that is what makes
 * "find or create a conversation" safe under concurrency, instead of two
 * simultaneous first messages creating two threads.
 */

const conversationSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],

    lastMessage: {
      content: { type: String, trim: true, maxlength: 300 },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      at: { type: Date },
    },

    /** Unread counts keyed by user id, so a badge needs no extra query. */
    unread: { type: Map, of: Number, default: () => new Map() },

    relatedProduct: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, updatedAt: -1 });

conversationSchema.statics.buildKey = (a, b) =>
  [String(a), String(b)].sort().join(":");

export default mongoose.model("Conversation", conversationSchema);
