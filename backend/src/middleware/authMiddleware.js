import User from "../models/User.js";
import Farm from "../models/Farm.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyToken, COOKIE_NAME } from "../utils/generateToken.js";
import { ROLES, VERIFICATION_STATUS } from "../utils/constants.js";

/**
 * Accepts the token from an httpOnly cookie or an Authorization header.
 * The cookie is the default because it is not reachable from JavaScript;
 * the header exists so non-browser clients and the Socket.IO handshake can
 * authenticate the same way.
 */
const readToken = (req) => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7).trim();
  if (req.cookies?.[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  return null;
};

/**
 * The user is loaded fresh on every request rather than trusted from the
 * token body. A token issued before a suspension would otherwise keep
 * working until it expired.
 */
export const protect = asyncHandler(async (req, _res, next) => {
  const token = readToken(req);
  if (!token) throw ApiError.unauthorized("Log in to continue", "NO_TOKEN");

  const payload = verifyToken(token);

  const user = await User.findById(payload.sub).select(
    "name email phone role avatar location isActive isVerified buyerProfile createdAt"
  );

  if (!user) throw ApiError.unauthorized("This account no longer exists", "USER_NOT_FOUND");
  if (!user.isActive) {
    throw ApiError.forbidden("This account has been suspended", "ACCOUNT_SUSPENDED");
  }

  req.user = user;
  req.userId = user._id;
  return next();
});

/** Attaches the user when a token is present, but never rejects. Used on
 *  public marketplace routes that personalise slightly when signed in. */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = readToken(req);
  if (!token) return next();

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub).select("name role isActive");
    if (user?.isActive) {
      req.user = user;
      req.userId = user._id;
    }
  } catch {
    /* An invalid token on a public route is simply an anonymous visitor. */
  }
  return next();
});

/**
 * Gate for farmer actions that require admin approval first. An unapproved
 * farmer can sign in and complete their farm profile; they cannot list.
 */
export const requireApprovedFarm = asyncHandler(async (req, _res, next) => {
  if (req.user.role !== ROLES.FARMER) {
    throw ApiError.forbidden("Only farmers can do this", "FARMER_ONLY");
  }

  const farm = await Farm.findOne({ farmer: req.user._id }).select(
    "verificationStatus farmName"
  );

  if (!farm) {
    throw ApiError.forbidden("Complete your farm profile first", "FARM_MISSING");
  }
  if (farm.verificationStatus !== VERIFICATION_STATUS.APPROVED) {
    throw ApiError.forbidden(
      farm.verificationStatus === VERIFICATION_STATUS.REJECTED
        ? "Your farm verification was not approved. Contact support to appeal."
        : "Your farm is still being verified. This usually takes two working days.",
      "FARM_NOT_APPROVED"
    );
  }

  req.farm = farm;
  return next();
});
