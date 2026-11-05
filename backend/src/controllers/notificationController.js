import asyncHandler from "../utils/asyncHandler.js";
import { ok, paginated } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { getQuery } from "../middleware/validationMiddleware.js";
import { readPageParams, buildPagination } from "../utils/pagination.js";
import Notification from "../models/Notification.js";

/** GET /api/notifications — always scoped to the caller. */
export const listNotifications = asyncHandler(async (req, res) => {
  const query = getQuery(req);
  const { page, limit, skip } = readPageParams(query);

  const filter = { recipient: req.user._id };
  if (query.isRead !== undefined) filter.isRead = query.isRead === "true";

  const [data, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);

  /* `data` is an array here as it is on every other list endpoint; the
     badge count rides along in `meta` rather than changing the shape. */
  return paginated(res, {
    message: "Notifications loaded",
    data,
    pagination: buildPagination({ page, limit, total }),
    meta: { unreadCount },
  });
});

/** GET /api/notifications/unread-count — cheap, for the navbar badge. */
export const unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });
  return ok(res, { message: "Unread count", data: { count } });
});

/** PATCH /api/notifications/:id/read */
export const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    throw ApiError.notFound("That notification is not yours", "NOTIFICATION_NOT_FOUND");
  }

  return ok(res, { message: "Marked as read", data: notification });
});

/** PATCH /api/notifications/read-all */
export const markAllRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  return ok(res, {
    message: "All notifications marked as read",
    data: { updated: result.modifiedCount },
  });
});

/** DELETE /api/notifications/:id */
export const removeNotification = asyncHandler(async (req, res) => {
  const result = await Notification.deleteOne({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!result.deletedCount) {
    throw ApiError.notFound("That notification is not yours", "NOTIFICATION_NOT_FOUND");
  }

  return ok(res, { message: "Notification removed", data: null });
});
