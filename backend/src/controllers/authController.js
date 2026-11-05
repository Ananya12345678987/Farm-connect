import asyncHandler from "../utils/asyncHandler.js";
import { ok, created } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/User.js";
import * as authService from "../services/authService.js";

/** POST /api/auth/register/farmer — public. Creates a PENDING farm. */
export const registerFarmer = asyncHandler(async (req, res) => {
  const { user, farm } = await authService.registerFarmer(req.body);
  const session = authService.issueSession(res, user);

  return created(res, {
    message: "Registration received. Your farm is being verified.",
    data: {
      ...session,
      farm: {
        _id: farm._id,
        farmName: farm.farmName,
        verificationStatus: farm.verificationStatus,
      },
      canSell: false,
    },
  });
});

/** POST /api/auth/register/buyer — public. Usable immediately. */
export const registerBuyer = asyncHandler(async (req, res) => {
  const { user } = await authService.registerBuyer(req.body);
  const session = authService.issueSession(res, user);

  return created(res, {
    message: "Welcome to FarmConnect",
    data: session,
  });
});

/**
 * POST /api/auth/register/admin — gated on ADMIN_SETUP_KEY from the server
 * environment. There is no path to an admin account through a normal
 * registration body.
 */
export const registerAdmin = asyncHandler(async (req, res) => {
  const { user } = await authService.registerAdmin(req.body);
  const session = authService.issueSession(res, user);

  return created(res, {
    message: "Administrator account created",
    data: session,
  });
});

/** POST /api/auth/login — public. */
export const login = asyncHandler(async (req, res) => {
  const user = await authService.login(req.body);
  const session = authService.issueSession(res, user);
  const context = await authService.buildSessionContext(user);

  return ok(res, {
    message: "Logged in",
    data: { ...session, ...context },
  });
});

/** POST /api/auth/logout — clears the cookie. A client holding a bearer
 *  token should discard it; tokens are stateless and expire on their own. */
export const logout = asyncHandler(async (_req, res) => {
  authService.clearSession(res);
  return ok(res, { message: "Logged out", data: null });
});

/** GET /api/auth/me — the signed-in shell in one request. */
export const me = asyncHandler(async (req, res) => {
  const context = await authService.buildSessionContext(req.user);
  return ok(res, { message: "Session loaded", data: context });
});

/** PATCH /api/auth/password */
export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+password");
  const matches = await user.comparePassword(req.body.currentPassword);

  if (!matches) {
    throw ApiError.unauthorized("Your current password is not correct", "INVALID_CREDENTIALS");
  }

  user.password = req.body.newPassword;
  await user.save();

  /* Force a fresh sign-in on other clients by rotating the cookie. */
  authService.issueSession(res, user);

  return ok(res, { message: "Password updated", data: null });
});
