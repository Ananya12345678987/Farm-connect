import ApiError from "../utils/ApiError.js";
import { ROLES } from "../utils/constants.js";

/**
 * Role gate. Always used after `protect`, and always on the server —
 * the frontend's role checks are for navigation, not for security.
 */
export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized("Log in to continue", "NO_TOKEN"));
  }
  if (!roles.includes(req.user.role)) {
    return next(
      ApiError.forbidden("Your account type cannot perform this action", "ROLE_FORBIDDEN")
    );
  }
  return next();
};

export const isAdmin = (user) => user?.role === ROLES.ADMIN;

/**
 * Ownership check used by every resource a user can own.
 *
 * `ownerId` is always read from the database document, never from the
 * request — a farmer sending someone else's farmer id in a body must not be
 * able to reach another farmer's product.
 */
export const assertOwnership = (ownerId, user, message = "This is not yours to change") => {
  if (isAdmin(user)) return;
  if (String(ownerId) !== String(user._id)) {
    throw ApiError.forbidden(message, "NOT_OWNER");
  }
};
