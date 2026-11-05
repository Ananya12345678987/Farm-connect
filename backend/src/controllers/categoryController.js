import asyncHandler from "../utils/asyncHandler.js";
import { ok, created } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { APPROVAL_STATUS } from "../utils/constants.js";

/** GET /api/categories — public. Active categories only unless admin. */
export const listCategories = asyncHandler(async (req, res) => {
  const filter = req.user?.role === "ADMIN" ? {} : { isActive: true };
  const categories = await Category.find(filter).sort({ name: 1 }).lean();
  return ok(res, { message: "Categories loaded", data: categories });
});

/** POST /api/categories — admin. */
export const createCategory = asyncHandler(async (req, res) => {
  const exists = await Category.findOne({
    name: new RegExp(`^${req.body.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
  }).select("_id");

  if (exists) throw ApiError.conflict("That category already exists", "CATEGORY_EXISTS");

  const category = await Category.create(req.body);
  return created(res, { message: "Category created", data: category });
});

/** PATCH /api/categories/:id — admin. */
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!category) throw ApiError.notFound("That category does not exist", "CATEGORY_NOT_FOUND");
  return ok(res, { message: "Category updated", data: category });
});

/**
 * DELETE /api/categories/:id — admin.
 * Refused while any live product still points at it, because deleting would
 * leave those products referencing nothing.
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound("That category does not exist", "CATEGORY_NOT_FOUND");

  const inUse = await Product.countDocuments({
    category: category._id,
    isActive: true,
    approvalStatus: { $ne: APPROVAL_STATUS.REJECTED },
  });

  if (inUse > 0) {
    throw ApiError.conflict(
      `${inUse} listing${inUse > 1 ? "s" : ""} still use this category. Deactivate it instead.`,
      "CATEGORY_IN_USE"
    );
  }

  await category.deleteOne();
  return ok(res, { message: "Category deleted", data: null });
});
