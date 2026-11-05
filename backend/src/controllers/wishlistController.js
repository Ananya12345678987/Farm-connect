import asyncHandler from "../utils/asyncHandler.js";
import { ok } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";

const POPULATE = {
  path: "products",
  select: "name slug price unit images availability averageRating reviewCount isOrganic location farmer",
  populate: { path: "farmer", select: "name" },
};

/** GET /api/wishlist */
export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOneAndUpdate(
    { buyer: req.user._id },
    { $setOnInsert: { buyer: req.user._id, products: [] } },
    { new: true, upsert: true }
  ).populate(POPULATE);

  return ok(res, { message: "Wishlist loaded", data: wishlist.products });
});

/** POST /api/wishlist/:productId — $addToSet makes duplicates impossible. */
export const addToWishlist = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.productId,
    ...Product.publicFilter(),
  }).select("_id");

  if (!product) throw ApiError.notFound("That listing is not available", "PRODUCT_NOT_FOUND");

  const wishlist = await Wishlist.findOneAndUpdate(
    { buyer: req.user._id },
    { $addToSet: { products: product._id } },
    { new: true, upsert: true }
  ).populate(POPULATE);

  return ok(res, { message: "Saved", data: wishlist.products });
});

/** DELETE /api/wishlist/:productId */
export const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOneAndUpdate(
    { buyer: req.user._id },
    { $pull: { products: req.params.productId } },
    { new: true }
  ).populate(POPULATE);

  if (!wishlist) throw ApiError.notFound("You have no saved listings", "WISHLIST_NOT_FOUND");

  return ok(res, { message: "Removed", data: wishlist.products });
});
