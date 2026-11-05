import User from "../models/User.js";
import Farm from "../models/Farm.js";
import Cart from "../models/Cart.js";
import Wishlist from "../models/Wishlist.js";
import bcrypt from "bcryptjs";
import ApiError from "../utils/ApiError.js";
import env from "../config/env.js";
import logger from "../utils/logger.js";
import { signToken, COOKIE_NAME, cookieOptions } from "../utils/generateToken.js";
import { ROLES, VERIFICATION_STATUS, NOTIFICATION_TYPE } from "../utils/constants.js";
import { createNotification } from "./notificationService.js";

/**
 * Registration, login and the session cookie.
 *
 * `role` is never read from the request body. Each registration endpoint
 * hard-codes the role it creates, which is what stops anyone posting
 * `{"role":"ADMIN"}` at the buyer endpoint.
 */

/* A real bcrypt hash of a value nobody knows, used only to equalise the
   timing of a miss against a hit. */
const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEe.6iCRuKsYJ8xJqJqHqXqHqXqHqXqHqXq";

const sanitize = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  avatar: user.avatar,
  location: user.location,
  isActive: user.isActive,
  isVerified: user.isVerified,
  buyerProfile: user.buyerProfile,
  createdAt: user.createdAt,
});

export const issueSession = (res, user) => {
  const token = signToken(user);
  res.cookie(COOKIE_NAME, token, cookieOptions());
  /* Also returned in the body: the Socket.IO handshake and any non-browser
     client need the raw token, and a cookie is not readable from JS. */
  return { user: sanitize(user), token };
};

export const clearSession = (res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
};

const assertEmailFree = async (email) => {
  const existing = await User.findOne({ email: email.toLowerCase() }).select("_id");
  if (existing) {
    throw ApiError.conflict("An account with that email already exists", "EMAIL_TAKEN");
  }
};

export const registerFarmer = async (input) => {
  await assertEmailFree(input.email);

  const user = await User.create({
    name: input.fullName,
    email: input.email,
    phone: input.phone,
    password: input.password,
    role: ROLES.FARMER,
    location: input.location,
  });

  let farm;
  try {
    farm = await Farm.create({
      farmer: user._id,
      farmName: input.farmName,
      location: input.location,
      state: input.state,
      district: input.district,
      pincode: input.pincode,
      farmType: input.farmType,
      totalArea: input.totalArea,
      areaUnit: input.areaUnit,
      description: input.description,
      /* Never auto-approved. An admin must review it. */
      verificationStatus: VERIFICATION_STATUS.PENDING,
    });
  } catch (error) {
    /* A user without a farm is a broken farmer account — undo it. */
    await User.deleteOne({ _id: user._id });
    logger.error("Farm creation failed during registration", { message: error.message });
    throw error;
  }

  await createNotification({
    recipient: user._id,
    type: NOTIFICATION_TYPE.PRODUCT_PENDING,
    title: "Registration received",
    message: `${farm.farmName} is being verified. This usually takes two working days, and you can set up your profile in the meantime.`,
    link: "/farmer-dashboard",
  }).catch(() => {});

  return { user, farm };
};

export const registerBuyer = async (input) => {
  await assertEmailFree(input.email);

  const user = await User.create({
    name: input.fullName,
    email: input.email,
    phone: input.phone,
    password: input.password,
    role: ROLES.BUYER,
    location: input.location,
    buyerProfile: {
      businessName: input.businessName,
      businessType: input.businessType,
    },
  });

  /* Created up front so cart and wishlist reads never have to handle a
     missing document. */
  await Promise.all([
    Cart.create({ buyer: user._id, items: [] }),
    Wishlist.create({ buyer: user._id, products: [] }),
  ]);

  return { user };
};

/**
 * Admin creation is gated on ADMIN_SETUP_KEY, which lives only in the server
 * environment. If it is unset, no admin can be created through the API at
 * all — the seed script is then the only route in.
 */
export const registerAdmin = async (input) => {
  if (!env.adminSetupKey) {
    throw ApiError.forbidden(
      "Administrator registration is disabled on this server",
      "ADMIN_SETUP_DISABLED"
    );
  }

  /* Compare in constant-ish time by length-checking first. */
  if (
    input.adminCode.length !== env.adminSetupKey.length ||
    input.adminCode !== env.adminSetupKey
  ) {
    logger.warn("Rejected admin registration attempt", { email: input.email });
    throw ApiError.forbidden("That administrator code is not valid", "INVALID_ADMIN_CODE");
  }

  await assertEmailFree(input.email);

  const user = await User.create({
    name: input.fullName,
    email: input.email,
    password: input.password,
    role: ROLES.ADMIN,
    isVerified: true,
  });

  return { user };
};

/**
 * Login.
 *
 * A wrong email and a wrong password return the identical message and take a
 * comparable amount of time, so the endpoint cannot be used to discover which
 * addresses are registered.
 */
export const login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user) {
    /* Spend a comparable amount of time on a throwaway hash, so response
       timing does not reveal whether the address is registered. */
    await bcrypt.compare(password, DUMMY_HASH);
    throw ApiError.unauthorized("Email or password is incorrect", "INVALID_CREDENTIALS");
  }

  const matches = await user.comparePassword(password);
  if (!matches) {
    throw ApiError.unauthorized("Email or password is incorrect", "INVALID_CREDENTIALS");
  }

  if (!user.isActive) {
    throw ApiError.forbidden(
      user.suspendedReason
        ? `This account is suspended: ${user.suspendedReason}`
        : "This account has been suspended",
      "ACCOUNT_SUSPENDED"
    );
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  return user;
};

/** Everything the frontend needs to render a signed-in shell in one call. */
export const buildSessionContext = async (user) => {
  const context = { user: sanitize(user) };

  if (user.role === ROLES.FARMER) {
    const farm = await Farm.findOne({ farmer: user._id }).lean();
    context.farm = farm
      ? {
          _id: farm._id,
          farmName: farm.farmName,
          location: farm.location,
          verificationStatus: farm.verificationStatus,
          isVerified: farm.isVerified,
          productCount: farm.productCount,
        }
      : null;
    context.canSell = farm?.verificationStatus === VERIFICATION_STATUS.APPROVED;
  }

  return context;
};

export { sanitize };
