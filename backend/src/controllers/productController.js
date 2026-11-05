import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import { ok, created, paginated } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { getQuery } from "../middleware/validationMiddleware.js";
import { assertOwnership } from "../middleware/roleMiddleware.js";
import { readPageParams, paginate } from "../utils/pagination.js";

import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Farm from "../models/Farm.js";
import Review from "../models/Review.js";

import { uploadImages, destroyMany } from "../services/cloudinaryService.js";
import { notifyProductPending } from "../services/notificationService.js";
import { APPROVAL_STATUS, AVAILABILITY } from "../utils/constants.js";

/**
 * Builds the Mongo filter for a marketplace query.
 *
 * Everything is pushed into the query so the database does the work against
 * its indexes. Nothing is fetched and filtered in JavaScript — that pattern
 * looks fine on seed data and falls over at ten thousand products.
 */
const buildMarketFilter = async (query) => {
  const filter = Product.publicFilter();

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  if (query.category) {
    /* Accept either an id or a slug, because the frontend links by slug. */
    const category = mongoose.Types.ObjectId.isValid(query.category)
      ? { _id: query.category }
      : { slug: query.category };
    const found = await Category.findOne(category).select("_id").lean();
    /* An unknown category must return nothing, not everything. */
    filter.category = found?._id ?? new mongoose.Types.ObjectId();
  }

  if (query.farmer) filter.farmer = query.farmer;
  if (query.state) filter.state = new RegExp(`^${escapeRegex(query.state)}$`, "i");
  if (query.district) filter.district = new RegExp(`^${escapeRegex(query.district)}$`, "i");
  if (query.location) filter.location = new RegExp(escapeRegex(query.location), "i");
  if (query.isOrganic !== undefined) filter.isOrganic = query.isOrganic;
  if (query.availability) filter.availability = query.availability;
  if (query.minRating) filter.averageRating = { $gte: query.minRating };

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {};
    if (query.minPrice !== undefined) filter.price.$gte = query.minPrice;
    if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice;
  }

  return filter;
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating: { averageRating: -1, reviewCount: -1 },
  popular: { soldCount: -1, viewCount: -1 },
};

/**
 * GET /api/products — public marketplace.
 * Only approved + active products are reachable here; `publicFilter` is
 * applied before anything the client sent.
 */
export const listProducts = asyncHandler(async (req, res) => {
  const query = getQuery(req);
  const { page, limit, skip } = readPageParams(query);
  const filter = await buildMarketFilter(query);

  let sort = SORTS[query.sort] ?? SORTS.newest;
  let projection;

  if (query.search) {
    projection = { score: { $meta: "textScore" } };
    if (query.sort === "relevance" || !query.sort || query.sort === "newest") {
      sort = { score: { $meta: "textScore" }, createdAt: -1 };
    }
  }

  const findQuery = Product.find(filter, projection)
    .select("name slug price unit quantity availability images isOrganic location averageRating reviewCount harvestDate createdAt")
    .populate("farmer", "name")
    .populate("category", "name slug")
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const [data, total] = await Promise.all([findQuery, Product.countDocuments(filter)]);

  return paginated(res, {
    message: "Listings loaded",
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  });
});

/**
 * GET /api/products/:id — public detail. Accepts an id or a slug.
 * Returns the farm and grower context a buyer needs, and nothing private:
 * no email, no phone, no address.
 */
export const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const match = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { slug: id };

  const product = await Product.findOne({ ...match, ...Product.publicFilter() })
    .populate("farmer", "name avatar location createdAt")
    .populate("category", "name slug")
    .lean();

  if (!product) throw ApiError.notFound("That listing is not available", "PRODUCT_NOT_FOUND");

  const [farm, recentReviews] = await Promise.all([
    Farm.findOne({ farmer: product.farmer._id })
      .select("farmName location district state farmType description averageRating reviewCount isVerified")
      .lean(),
    Review.find({ product: product._id, isHidden: false })
      .select("rating comment createdAt buyer")
      .populate("buyer", "name avatar")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  /* Fire-and-forget: a view counter must never slow or fail a page load. */
  Product.updateOne({ _id: product._id }, { $inc: { viewCount: 1 } }).catch(() => {});

  return ok(res, {
    message: "Listing loaded",
    data: { product, farm, reviews: recentReviews },
  });
});

/**
 * POST /api/products — farmer only, and only once their farm is approved
 * (enforced by requireApprovedFarm on the route).
 *
 * The product is created PENDING and is invisible to buyers until an admin
 * approves it.
 */
export const createProduct = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.body.category).select("_id isActive");
  if (!category || !category.isActive) {
    throw ApiError.badRequest("Choose a valid category", "CATEGORY_INVALID");
  }

  let images = [];
  if (req.files?.length) {
    images = await uploadImages(req.files, "farmconnect/products");
  }

  try {
    const product = await Product.create({
      ...req.body,
      farmer: req.user._id,
      farm: req.farm?._id,
      images,
      approvalStatus: APPROVAL_STATUS.PENDING,
      availability:
        req.body.quantity > 0 ? AVAILABILITY.AVAILABLE : AVAILABILITY.OUT_OF_STOCK,
    });

    product.syncAvailability();
    await product.save();

    await Promise.all([
      Category.updateOne({ _id: category._id }, { $inc: { productCount: 1 } }),
      Farm.updateOne({ farmer: req.user._id }, { $inc: { productCount: 1 } }),
      notifyProductPending(req.user._id, product),
    ]);

    return created(res, {
      message: "Listing submitted. An admin will review it shortly.",
      data: product,
    });
  } catch (error) {
    /* Do not leave orphaned uploads behind a failed write. */
    await destroyMany(images.map((image) => image.publicId));
    throw error;
  }
});

/** PATCH /api/products/:id — farmer's own product, or admin. */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound("That listing does not exist", "PRODUCT_NOT_FOUND");

  assertOwnership(product.farmer, req.user, "You can only edit your own listings");

  if (req.body.category && String(req.body.category) !== String(product.category)) {
    const category = await Category.findById(req.body.category).select("_id isActive");
    if (!category?.isActive) {
      throw ApiError.badRequest("Choose a valid category", "CATEGORY_INVALID");
    }
    await Promise.all([
      Category.updateOne({ _id: product.category }, { $inc: { productCount: -1 } }),
      Category.updateOne({ _id: category._id }, { $inc: { productCount: 1 } }),
    ]);
  }

  const materialChange =
    (req.body.name && req.body.name !== product.name) ||
    (req.body.price && req.body.price !== product.price) ||
    (req.body.description && req.body.description !== product.description);

  Object.assign(product, req.body);

  /* A farmer editing an approved listing's substance sends it back for
     review, so an approved listing cannot quietly become something else. */
  if (materialChange && req.user.role !== "ADMIN") {
    product.approvalStatus = APPROVAL_STATUS.PENDING;
    product.approvedAt = undefined;
  }

  product.syncAvailability();
  await product.save();

  return ok(res, {
    message: materialChange
      ? "Listing updated and sent for review"
      : "Listing updated",
    data: product,
  });
});

/** POST /api/products/:id/images */
export const addProductImages = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound("That listing does not exist", "PRODUCT_NOT_FOUND");

  assertOwnership(product.farmer, req.user, "You can only edit your own listings");

  if (!req.files?.length) throw ApiError.badRequest("Attach at least one image", "NO_IMAGES");

  const images = await uploadImages(req.files, "farmconnect/products");
  product.images.push(...images);
  await product.save();

  return ok(res, { message: "Images added", data: product.images });
});

/** DELETE /api/products/:id/images/:publicId */
export const removeProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound("That listing does not exist", "PRODUCT_NOT_FOUND");

  assertOwnership(product.farmer, req.user, "You can only edit your own listings");

  const publicId = decodeURIComponent(req.params.publicId);
  const exists = product.images.some((image) => image.publicId === publicId);
  if (!exists) throw ApiError.notFound("That image is not on this listing", "IMAGE_NOT_FOUND");

  product.images = product.images.filter((image) => image.publicId !== publicId);
  await product.save();
  await destroyMany([publicId]);

  return ok(res, { message: "Image removed", data: product.images });
});

/**
 * DELETE /api/products/:id
 * Soft delete by default: a product referenced by past orders must keep
 * existing so those orders stay readable.
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound("That listing does not exist", "PRODUCT_NOT_FOUND");

  assertOwnership(product.farmer, req.user, "You can only remove your own listings");

  product.isActive = false;
  await product.save();

  await Promise.all([
    Category.updateOne({ _id: product.category }, { $inc: { productCount: -1 } }),
    Farm.updateOne({ farmer: product.farmer }, { $inc: { productCount: -1 } }),
  ]);

  return ok(res, { message: "Listing removed from the marketplace", data: null });
});

/** GET /api/farmer/products — the farmer's own listings, any status. */
export const listMyProducts = asyncHandler(async (req, res) => {
  const query = getQuery(req);
  const { page, limit, skip } = readPageParams(query);

  const filter = { farmer: req.user._id };
  if (query.approvalStatus) filter.approvalStatus = query.approvalStatus;
  if (query.search) filter.name = new RegExp(escapeRegex(query.search), "i");

  const { data, pagination } = await paginate(Product, filter, {
    page,
    limit,
    skip,
    sort: SORTS[query.sort] ?? SORTS.newest,
    populate: { path: "category", select: "name slug" },
  });

  return paginated(res, { message: "Your listings", data, pagination });
});
