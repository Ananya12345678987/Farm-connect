import Notification from "../models/Notification.js";
import { notifyUser } from "./socketService.js";
import logger from "../utils/logger.js";
import { NOTIFICATION_TYPE } from "../utils/constants.js";

/**
 * Persist first, then emit.
 *
 * The database row is the source of truth; the socket emit is an optimisation
 * for users who happen to be connected. A failed emit must never fail the
 * business operation that triggered it, so emitting is wrapped and swallowed.
 */

export const createNotification = async ({
  recipient,
  type,
  title,
  message,
  relatedEntity,
  link,
  session,
}) => {
  const [doc] = await Notification.create(
    [{ recipient, type, title, message, relatedEntity, link }],
    session ? { session } : {}
  );

  /* Inside a transaction the row is not visible to anyone yet, so the emit
     is deferred to the caller via emitPending() after commit. */
  if (!session) safeEmit(doc);

  return doc;
};

export const createMany = async (notifications, session) => {
  if (!notifications.length) return [];

  const docs = await Notification.insertMany(notifications, session ? { session } : {});
  if (!session) docs.forEach(safeEmit);
  return docs;
};

/** Emits notifications that were written inside a transaction, after commit. */
export const emitPending = (docs = []) => {
  docs.filter(Boolean).forEach(safeEmit);
};

function safeEmit(doc) {
  try {
    notifyUser(doc.recipient, {
      _id: doc._id,
      type: doc.type,
      title: doc.title,
      message: doc.message,
      link: doc.link,
      relatedEntity: doc.relatedEntity,
      isRead: false,
      createdAt: doc.createdAt,
    });
  } catch (error) {
    logger.warn("Notification emit failed", { message: error.message });
  }
}

/* ---------------- Typed builders ----------------
   Keeping the copy here means notification wording is consistent and lives
   in one file rather than being retyped in six controllers. */

export const notifyFarmerApproved = (farmerId, farmName) =>
  createNotification({
    recipient: farmerId,
    type: NOTIFICATION_TYPE.FARMER_APPROVED,
    title: "Your farm is verified",
    message: `${farmName} has been approved. You can now list produce on the marketplace.`,
    link: "/farmer-dashboard",
  });

export const notifyFarmerRejected = (farmerId, farmName, reason) =>
  createNotification({
    recipient: farmerId,
    type: NOTIFICATION_TYPE.FARMER_REJECTED,
    title: "Farm verification was not approved",
    message: reason
      ? `${farmName}: ${reason}`
      : `${farmName} could not be verified. Contact support to appeal.`,
    link: "/farmer-dashboard",
  });

export const notifyProductPending = (farmerId, product) =>
  createNotification({
    recipient: farmerId,
    type: NOTIFICATION_TYPE.PRODUCT_PENDING,
    title: "Listing submitted for review",
    message: `"${product.name}" is awaiting admin approval and is not public yet.`,
    relatedEntity: { kind: "Product", id: product._id },
    link: "/farmer-dashboard",
  });

export const notifyProductApproved = (farmerId, product) =>
  createNotification({
    recipient: farmerId,
    type: NOTIFICATION_TYPE.PRODUCT_APPROVED,
    title: "Listing approved",
    message: `"${product.name}" is now live on the marketplace.`,
    relatedEntity: { kind: "Product", id: product._id },
    link: "/farmer-dashboard",
  });

export const notifyProductRejected = (farmerId, product, reason) =>
  createNotification({
    recipient: farmerId,
    type: NOTIFICATION_TYPE.PRODUCT_REJECTED,
    title: "Listing not approved",
    message: reason
      ? `"${product.name}": ${reason}`
      : `"${product.name}" was not approved.`,
    relatedEntity: { kind: "Product", id: product._id },
    link: "/farmer-dashboard",
  });

export const notifyNewReview = (farmerId, product, rating) =>
  createNotification({
    recipient: farmerId,
    type: NOTIFICATION_TYPE.NEW_REVIEW,
    title: `New ${rating}-star review`,
    message: `A buyer reviewed "${product.name}".`,
    relatedEntity: { kind: "Product", id: product._id },
    link: "/farmer-dashboard",
  });

export const notifyNewMessage = (receiverId, senderName, preview, conversationId) =>
  createNotification({
    recipient: receiverId,
    type: NOTIFICATION_TYPE.NEW_MESSAGE,
    title: `Message from ${senderName}`,
    message: preview.slice(0, 140),
    relatedEntity: { kind: "Conversation", id: conversationId },
    link: "/messages",
  });

export const notifyAccountSuspended = (userId, reason) =>
  createNotification({
    recipient: userId,
    type: NOTIFICATION_TYPE.ACCOUNT_SUSPENDED,
    title: "Your account has been suspended",
    message: reason ?? "Contact support for details.",
  });
