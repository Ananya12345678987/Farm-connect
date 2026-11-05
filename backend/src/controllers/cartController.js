import asyncHandler from "../utils/asyncHandler.js";
import { ok } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { DELIVERY_FEE_PER_FARMER, FREE_DELIVERY_THRESHOLD } from "../utils/constants.js";

/**
 * The cart stores product ids and quantities only. Prices are read live from
 * the products on every read, so a cart left open overnight cannot be used to
 * buy at yesterday's rate, and a sold-out item is flagged rather than
 * silently kept.
 */
const loadCart = async (buyerId) => {
  const cart = await Cart.findOneAndUpdate(
    { buyer: buyerId },
    { $setOnInsert: { buyer: buyerId, items: [] } },
    { new: true, upsert: true }
  ).populate({
    path: "items.product",
    select: "name slug price unit quantity images availability approvalStatus isActive farmer",
    populate: { path: "farmer", select: "name" },
  });

  const lines = [];
  const issues = [];

  for (const item of cart.items) {
    const product = item.product;

    if (!product || !product.isActive || product.approvalStatus !== "APPROVED") {
      issues.push({ product: item.product?._id, reason: "NO_LONGER_AVAILABLE" });
      continue;
    }

    const available = Math.min(item.quantity, product.quantity);
    if (product.quantity < item.quantity) {
      issues.push({
        product: product._id,
        name: product.name,
        reason: "INSUFFICIENT_STOCK",
        available: product.quantity,
      });
    }

    lines.push({
      product: {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        unit: product.unit,
        image: product.images?.[0]?.url ?? "",
        availability: product.availability,
        stock: product.quantity,
        farmer: product.farmer,
      },
      quantity: item.quantity,
      /* Computed here, never stored. */
      subtotal: Math.round(product.price * available * 100) / 100,
    });
  }

  const farmerIds = new Set(lines.map((line) => String(line.product.farmer?._id)));
  const subtotal = Math.round(lines.reduce((sum, line) => sum + line.subtotal, 0) * 100) / 100;
  const deliveryFee =
    subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : farmerIds.size * DELIVERY_FEE_PER_FARMER;

  return {
    items: lines,
    issues,
    summary: {
      itemCount: lines.length,
      farmerCount: farmerIds.size,
      subtotal,
      deliveryFee,
      total: Math.round((subtotal + deliveryFee) * 100) / 100,
    },
  };
};

/** GET /api/cart */
export const getCart = asyncHandler(async (req, res) =>
  ok(res, { message: "Cart loaded", data: await loadCart(req.user._id) })
);

/** POST /api/cart/items */
export const addItem = asyncHandler(async (req, res) => {
  const { product: productId, quantity } = req.body;

  const product = await Product.findOne({ _id: productId, ...Product.publicFilter() }).select(
    "quantity name unit"
  );

  if (!product) throw ApiError.notFound("That listing is not available", "PRODUCT_NOT_FOUND");

  const cart = await Cart.findOneAndUpdate(
    { buyer: req.user._id },
    { $setOnInsert: { buyer: req.user._id } },
    { new: true, upsert: true }
  );

  const existing = cart.items.find((item) => String(item.product) === String(productId));
  const desired = (existing?.quantity ?? 0) + quantity;

  if (desired > product.quantity) {
    throw ApiError.conflict(
      `Only ${product.quantity} ${product.unit} of "${product.name}" are available`,
      "INSUFFICIENT_STOCK"
    );
  }

  if (existing) existing.quantity = desired;
  else cart.items.push({ product: productId, quantity });

  await cart.save();

  return ok(res, { message: "Added to cart", data: await loadCart(req.user._id) });
});

/** PATCH /api/cart/items/:productId */
export const updateItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const { productId } = req.params;

  const product = await Product.findOne({ _id: productId, ...Product.publicFilter() }).select(
    "quantity name unit"
  );
  if (!product) throw ApiError.notFound("That listing is not available", "PRODUCT_NOT_FOUND");

  if (quantity > product.quantity) {
    throw ApiError.conflict(
      `Only ${product.quantity} ${product.unit} of "${product.name}" are available`,
      "INSUFFICIENT_STOCK"
    );
  }

  const cart = await Cart.findOne({ buyer: req.user._id });
  const item = cart?.items.find((entry) => String(entry.product) === String(productId));

  if (!item) throw ApiError.notFound("That item is not in your cart", "CART_ITEM_NOT_FOUND");

  item.quantity = quantity;
  await cart.save();

  return ok(res, { message: "Cart updated", data: await loadCart(req.user._id) });
});

/** DELETE /api/cart/items/:productId */
export const removeItem = asyncHandler(async (req, res) => {
  await Cart.updateOne(
    { buyer: req.user._id },
    { $pull: { items: { product: req.params.productId } } }
  );

  return ok(res, { message: "Removed from cart", data: await loadCart(req.user._id) });
});

/** DELETE /api/cart */
export const clearCart = asyncHandler(async (req, res) => {
  await Cart.updateOne({ buyer: req.user._id }, { $set: { items: [] } });
  return ok(res, { message: "Cart cleared", data: await loadCart(req.user._id) });
});

export { loadCart };
