import asyncHandler from "../utils/asyncHandler.js";
import { ok } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/User.js";
import { uploadSingle, destroyImage } from "../services/cloudinaryService.js";
import { sanitize } from "../services/authService.js";

/** GET /api/users/me */
export const getMe = asyncHandler(async (req, res) =>
  ok(res, { message: "Profile loaded", data: sanitize(req.user) })
);

/**
 * PATCH /api/users/me
 * The schema is strict, so role, isActive and password cannot be smuggled in.
 */
export const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, req.body, {
    new: true,
    runValidators: true,
  });

  return ok(res, { message: "Profile updated", data: sanitize(user) });
});

/** POST /api/users/me/avatar — multipart, field name `avatar`. */
export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("Attach an image", "NO_IMAGE");

  const image = await uploadSingle(req.file, "farmconnect/avatars");
  const user = await User.findById(req.user._id);
  const previous = user.avatar?.publicId;

  user.avatar = { url: image.url, publicId: image.publicId };
  await user.save();

  /* Only after the new one is safely stored. */
  if (previous) await destroyImage(previous);

  return ok(res, { message: "Photo updated", data: sanitize(user) });
});

/** POST /api/users/me/addresses */
export const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user.addresses.length >= 10) {
    throw ApiError.badRequest("You can save at most 10 addresses", "TOO_MANY_ADDRESSES");
  }

  user.addresses.push(req.body);
  await user.save();

  return ok(res, { message: "Address saved", data: user.addresses });
});

/** DELETE /api/users/me/addresses/:index */
export const removeAddress = asyncHandler(async (req, res) => {
  const index = Number(req.params.index);
  const user = await User.findById(req.user._id);

  if (!Number.isInteger(index) || index < 0 || index >= user.addresses.length) {
    throw ApiError.notFound("That address is not on your account", "ADDRESS_NOT_FOUND");
  }

  user.addresses.splice(index, 1);
  await user.save();

  return ok(res, { message: "Address removed", data: user.addresses });
});
