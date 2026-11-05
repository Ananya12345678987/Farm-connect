/**
 * Seed script.
 *
 *   npm run seed          add missing data, leave existing rows alone
 *   npm run seed:fresh    wipe the collections below first
 *
 * Refuses to run against NODE_ENV=production without FORCE_SEED=yes, because
 * `--fresh` against a live database would delete real orders.
 */

import mongoose from "mongoose";
import env from "../src/config/env.js";
import logger from "../src/utils/logger.js";
import { connectDB, disconnectDB } from "../src/config/db.js";

import User from "../src/models/User.js";
import Farm from "../src/models/Farm.js";
import Category from "../src/models/Category.js";
import Product from "../src/models/Product.js";
import Cart from "../src/models/Cart.js";
import Wishlist from "../src/models/Wishlist.js";
import Order from "../src/models/Order.js";
import Review from "../src/models/Review.js";
import Notification from "../src/models/Notification.js";
import Conversation from "../src/models/Conversation.js";
import Message from "../src/models/Message.js";
import Report from "../src/models/Report.js";

import {
  ROLES,
  VERIFICATION_STATUS,
  APPROVAL_STATUS,
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} from "../src/utils/constants.js";

const FRESH = process.argv.includes("--fresh");
const PASSWORD = env.seedPassword;

/* ---------------- Categories ---------------- */

const CATEGORIES = [
  { name: "Vegetables", description: "Fresh field and greenhouse vegetables", icon: "leaf" },
  { name: "Fruits", description: "Orchard and seasonal fruit", icon: "apple" },
  { name: "Grains", description: "Rice, wheat, millets and other cereals", icon: "wheat" },
  { name: "Pulses", description: "Dals, grams and lentils", icon: "beans" },
  { name: "Spices", description: "Turmeric, chilli, coriander and more", icon: "pepper" },
  { name: "Organic Produce", description: "Certified and input-free produce", icon: "sprout" },
  { name: "Dairy", description: "Milk, curd, ghee and paneer", icon: "milk" },
  { name: "Other", description: "Anything that does not fit elsewhere", icon: "box" },
];

/* ---------------- People ---------------- */

const FARMERS = [
  {
    name: "Shivamma Gowda",
    email: "farmer@example.com",
    phone: "9845012345",
    farmName: "Gowda Thota",
    location: "Kolar, Karnataka",
    state: "Karnataka",
    district: "Kolar",
    pincode: "563101",
    farmType: "VEGETABLES",
    totalArea: 4.5,
    crops: ["Tomato", "Beans", "Ragi"],
    description: "Four and a half acres under vegetables, worked by the family since 1994.",
    status: VERIFICATION_STATUS.APPROVED,
  },
  {
    name: "Ravi Patil",
    email: "ravi.patil@example.com",
    phone: "9822011223",
    farmName: "Patil Organics",
    location: "Dharwad, Karnataka",
    state: "Karnataka",
    district: "Dharwad",
    pincode: "580001",
    farmType: "ORGANIC",
    totalArea: 3,
    crops: ["Palak", "Methi", "Coriander"],
    description: "Certified organic leafy greens, cut to order each morning.",
    status: VERIFICATION_STATUS.APPROVED,
  },
  {
    name: "Sunita Kadam",
    email: "sunita.kadam@example.com",
    phone: "9876501234",
    farmName: "Kadam Aamrai",
    location: "Ratnagiri, Maharashtra",
    state: "Maharashtra",
    district: "Ratnagiri",
    pincode: "415612",
    farmType: "FRUITS",
    totalArea: 12,
    crops: ["Alphonso mango", "Cashew"],
    description: "GI-tagged Alphonso from a twelve-acre orchard, ripened without carbide.",
    status: VERIFICATION_STATUS.APPROVED,
  },
  {
    name: "Basavaraj Hiremath",
    email: "basavaraj@example.com",
    phone: "9740099887",
    farmName: "Hiremath Bhoomi",
    location: "Raichur, Karnataka",
    state: "Karnataka",
    district: "Raichur",
    pincode: "584101",
    farmType: "GRAINS",
    totalArea: 22,
    crops: ["Sona Masuri", "Jowar"],
    description: "Single-variety paddy lots, never blended across fields.",
    status: VERIFICATION_STATUS.APPROVED,
  },
  {
    name: "Gurpreet Singh",
    email: "gurpreet@example.com",
    phone: "9815533221",
    farmName: "Singh Kheti",
    location: "Ludhiana, Punjab",
    state: "Punjab",
    district: "Ludhiana",
    pincode: "141001",
    farmType: "MIXED",
    totalArea: 30,
    crops: ["Wheat", "Potato"],
    description: "Thirty acres of wheat and potato in the Malwa belt.",
    /* Left pending on purpose, so the admin queue is not empty on a fresh
       install and the approval flow can be exercised end to end. */
    status: VERIFICATION_STATUS.PENDING,
  },
];

const BUYERS = [
  {
    name: "Anand Kulkarni",
    email: "buyer@example.com",
    phone: "9900112233",
    businessName: "Anand Traders",
    businessType: "Wholesale",
    location: "Hubballi, Karnataka",
  },
  {
    name: "Priya Menon",
    email: "priya.menon@example.com",
    phone: "9633445566",
    businessName: "Green Basket Retail",
    businessType: "Retail chain",
    location: "Bengaluru, Karnataka",
  },
];

const ADMIN = { name: "Meera Rao", email: "admin@example.com" };

/* ---------------- Products ----------------
   Rates are in the range these crops actually traded at in Indian mandis. */

const PRODUCTS = [
  {
    farmer: "farmer@example.com", category: "Vegetables",
    name: "Nati tomatoes", price: 28, quantity: 1200, unit: "kg",
    description: "Thick-skinned local variety that travels well over long distances. Graded and crated.",
    isOrganic: false, approval: APPROVAL_STATUS.APPROVED, harvestOffset: 3,
  },
  {
    farmer: "farmer@example.com", category: "Vegetables",
    name: "Red onions, medium", price: 24, quantity: 3000, unit: "kg",
    description: "Cured in shade for twelve days, low sprouting risk in storage.",
    isOrganic: false, approval: APPROVAL_STATUS.APPROVED, harvestOffset: 7,
  },
  {
    farmer: "farmer@example.com", category: "Grains",
    name: "Finger millet (ragi)", price: 4200, quantity: 40, unit: "quintal",
    description: "Rain-fed ragi, cleaned and bagged in 50kg sacks.",
    isOrganic: false, approval: APPROVAL_STATUS.PENDING, harvestOffset: 14,
  },
  {
    farmer: "ravi.patil@example.com", category: "Organic Produce",
    name: "Organic palak", price: 42, quantity: 180, unit: "kg",
    description: "Cut to order each morning and packed in returnable crates.",
    isOrganic: true, approval: APPROVAL_STATUS.APPROVED, harvestOffset: 1,
  },
  {
    farmer: "ravi.patil@example.com", category: "Organic Produce",
    name: "Organic coriander", price: 60, quantity: 90, unit: "kg",
    description: "Grown without chemical inputs for six seasons running.",
    isOrganic: true, approval: APPROVAL_STATUS.APPROVED, harvestOffset: 2,
  },
  {
    farmer: "sunita.kadam@example.com", category: "Fruits",
    name: "Alphonso mangoes", price: 780, quantity: 340, unit: "dozen",
    description: "GI-tagged Ratnagiri Alphonso, naturally ripened without carbide.",
    isOrganic: false, approval: APPROVAL_STATUS.APPROVED, harvestOffset: 5,
  },
  {
    farmer: "sunita.kadam@example.com", category: "Fruits",
    name: "Nendran bananas", price: 54, quantity: 900, unit: "kg",
    description: "Cut green for transit, ripens in four to five days.",
    isOrganic: false, approval: APPROVAL_STATUS.APPROVED, harvestOffset: 2,
  },
  {
    farmer: "basavaraj@example.com", category: "Grains",
    name: "Sona Masuri rice", price: 4350, quantity: 220, unit: "quintal",
    description: "Single-variety lot from one field, no blending.",
    isOrganic: false, approval: APPROVAL_STATUS.APPROVED, harvestOffset: 18,
  },
  {
    farmer: "basavaraj@example.com", category: "Pulses",
    name: "Toor dal, unpolished", price: 9800, quantity: 55, unit: "quintal",
    description: "Unpolished, no water or oil treatment.",
    isOrganic: false, approval: APPROVAL_STATUS.APPROVED, harvestOffset: 25,
  },
  {
    farmer: "basavaraj@example.com", category: "Grains",
    name: "Groundnuts, bold grade", price: 6800, quantity: 60, unit: "quintal",
    description: "Sun-dried to 7% moisture, graded and bagged.",
    isOrganic: false, approval: APPROVAL_STATUS.APPROVED, harvestOffset: 12,
  },
  {
    farmer: "ravi.patil@example.com", category: "Spices",
    name: "Turmeric fingers", price: 14200, quantity: 28, unit: "quintal",
    description: "Lab-tested at 3.4% curcumin, polished and sorted.",
    isOrganic: true, approval: APPROVAL_STATUS.APPROVED, harvestOffset: 26,
  },
  {
    farmer: "sunita.kadam@example.com", category: "Fruits",
    name: "Cashew, raw W240", price: 68000, quantity: 8, unit: "quintal",
    description: "Whole raw kernels, W240 grade, vacuum packed.",
    isOrganic: false, approval: APPROVAL_STATUS.PENDING, harvestOffset: 30,
  },
];

const daysAgo = (n) => new Date(Date.now() - n * 86400000);

const run = async () => {
  if (env.isProd && process.env.FORCE_SEED !== "yes") {
    logger.error("Refusing to seed a production database. Set FORCE_SEED=yes to override.");
    process.exit(1);
  }

  await connectDB();

  if (FRESH) {
    logger.warn("--fresh: clearing collections");
    await Promise.all([
      User.deleteMany({}), Farm.deleteMany({}), Category.deleteMany({}),
      Product.deleteMany({}), Cart.deleteMany({}), Wishlist.deleteMany({}),
      Order.deleteMany({}), Review.deleteMany({}), Notification.deleteMany({}),
      Conversation.deleteMany({}), Message.deleteMany({}), Report.deleteMany({}),
    ]);
  }

  /* ---- Categories ---- */
  const categories = {};
  for (const entry of CATEGORIES) {
    // eslint-disable-next-line no-await-in-loop
    let category = await Category.findOne({ name: entry.name });
    // eslint-disable-next-line no-await-in-loop
    if (!category) category = await Category.create(entry);
    categories[entry.name] = category;
  }
  logger.info(`Categories: ${Object.keys(categories).length}`);

  /* ---- Admin ---- */
  let admin = await User.findOne({ email: ADMIN.email });
  if (!admin) {
    admin = await User.create({
      ...ADMIN,
      password: PASSWORD,
      role: ROLES.ADMIN,
      isVerified: true,
    });
  }

  /* ---- Farmers and farms ---- */
  const farmers = {};
  for (const entry of FARMERS) {
    // eslint-disable-next-line no-await-in-loop
    let user = await User.findOne({ email: entry.email });
    if (!user) {
      // eslint-disable-next-line no-await-in-loop
      user = await User.create({
        name: entry.name,
        email: entry.email,
        phone: entry.phone,
        password: PASSWORD,
        role: ROLES.FARMER,
        location: entry.location,
        isVerified: entry.status === VERIFICATION_STATUS.APPROVED,
      });
    }

    // eslint-disable-next-line no-await-in-loop
    let farm = await Farm.findOne({ farmer: user._id });
    if (!farm) {
      // eslint-disable-next-line no-await-in-loop
      farm = await Farm.create({
        farmer: user._id,
        farmName: entry.farmName,
        description: entry.description,
        location: entry.location,
        state: entry.state,
        district: entry.district,
        pincode: entry.pincode,
        farmType: entry.farmType,
        totalArea: entry.totalArea,
        crops: entry.crops,
        verificationStatus: entry.status,
        verifiedAt: entry.status === VERIFICATION_STATUS.APPROVED ? daysAgo(40) : undefined,
        verifiedBy: entry.status === VERIFICATION_STATUS.APPROVED ? admin._id : undefined,
      });
    }

    farmers[entry.email] = { user, farm, entry };
  }
  logger.info(`Farmers: ${Object.keys(farmers).length}`);

  /* ---- Buyers ---- */
  const buyers = {};
  for (const entry of BUYERS) {
    // eslint-disable-next-line no-await-in-loop
    let user = await User.findOne({ email: entry.email });
    if (!user) {
      // eslint-disable-next-line no-await-in-loop
      user = await User.create({
        name: entry.name,
        email: entry.email,
        phone: entry.phone,
        password: PASSWORD,
        role: ROLES.BUYER,
        location: entry.location,
        isVerified: true,
        buyerProfile: { businessName: entry.businessName, businessType: entry.businessType },
      });
      // eslint-disable-next-line no-await-in-loop
      await Cart.create({ buyer: user._id, items: [] });
      // eslint-disable-next-line no-await-in-loop
      await Wishlist.create({ buyer: user._id, products: [] });
    }
    buyers[entry.email] = user;
  }
  logger.info(`Buyers: ${Object.keys(buyers).length}`);

  /* ---- Products ---- */
  const products = [];
  for (const entry of PRODUCTS) {
    const owner = farmers[entry.farmer];
    // eslint-disable-next-line no-await-in-loop
    let product = await Product.findOne({ name: entry.name, farmer: owner.user._id });

    if (!product) {
      // eslint-disable-next-line no-await-in-loop
      product = await Product.create({
        farmer: owner.user._id,
        farm: owner.farm._id,
        name: entry.name,
        description: entry.description,
        category: categories[entry.category]._id,
        price: entry.price,
        quantity: entry.quantity,
        unit: entry.unit,
        location: owner.entry.location,
        state: owner.entry.state,
        district: owner.entry.district,
        harvestDate: daysAgo(entry.harvestOffset),
        isOrganic: entry.isOrganic,
        approvalStatus: entry.approval,
        approvedAt: entry.approval === APPROVAL_STATUS.APPROVED ? daysAgo(entry.harvestOffset) : undefined,
        approvedBy: entry.approval === APPROVAL_STATUS.APPROVED ? admin._id : undefined,
        /* No images: Cloudinary may not be configured, and a fake URL would
           render as a broken image. Upload real ones through the API. */
        images: [],
      });
    }
    products.push(product);
  }

  await Promise.all(
    Object.values(categories).map(async (category) => {
      const count = await Product.countDocuments({ category: category._id });
      await Category.updateOne({ _id: category._id }, { productCount: count });
    })
  );
  await Promise.all(
    Object.values(farmers).map(async ({ user, farm }) => {
      const count = await Product.countDocuments({ farmer: user._id });
      await Farm.updateOne({ _id: farm._id }, { productCount: count });
    })
  );
  logger.info(`Products: ${products.length}`);

  /* ---- A delivered order, so reviews and dashboards have real data ---- */
  const buyer = buyers["buyer@example.com"];
  const existingOrders = await Order.countDocuments({ buyer: buyer._id });

  if (!existingOrders) {
    const tomato = products.find((p) => p.name === "Nati tomatoes");
    const palak = products.find((p) => p.name === "Organic palak");
    const mango = products.find((p) => p.name === "Alphonso mangoes");

    const makeItem = (product, quantity) => ({
      product: product._id,
      farmer: product.farmer,
      nameSnapshot: product.name,
      priceSnapshot: product.price,
      unit: product.unit,
      imageSnapshot: "",
      quantity,
      subtotal: product.price * quantity,
    });

    const address = {
      fullName: "Anand Kulkarni",
      phone: "9900112233",
      line1: "Shop 14, APMC Yard, Gokul Road",
      city: "Hubballi",
      district: "Dharwad",
      state: "Karnataka",
      pincode: "580030",
    };

    /* Delivered, two farmers — exercises the multi-farmer split. */
    const itemsA = [makeItem(tomato, 400)];
    const itemsB = [makeItem(palak, 60)];
    const subA = itemsA[0].subtotal;
    const subB = itemsB[0].subtotal;

    const delivered = await Order.create({
      buyer: buyer._id,
      subOrders: [
        {
          farmer: tomato.farmer, farm: tomato.farm, items: itemsA,
          subtotal: subA, deliveryFee: 0, total: subA,
          status: ORDER_STATUS.DELIVERED,
          statusHistory: [
            { status: ORDER_STATUS.PLACED, at: daysAgo(9) },
            { status: ORDER_STATUS.CONFIRMED, at: daysAgo(8) },
            { status: ORDER_STATUS.PROCESSING, at: daysAgo(8) },
            { status: ORDER_STATUS.READY, at: daysAgo(7) },
            { status: ORDER_STATUS.OUT_FOR_DELIVERY, at: daysAgo(7) },
            { status: ORDER_STATUS.DELIVERED, at: daysAgo(6) },
          ],
        },
        {
          farmer: palak.farmer, farm: palak.farm, items: itemsB,
          subtotal: subB, deliveryFee: 40, total: subB + 40,
          status: ORDER_STATUS.DELIVERED,
          statusHistory: [
            { status: ORDER_STATUS.PLACED, at: daysAgo(9) },
            { status: ORDER_STATUS.DELIVERED, at: daysAgo(6) },
          ],
        },
      ],
      shippingAddress: address,
      subtotal: subA + subB,
      deliveryFee: 40,
      totalAmount: subA + subB + 40,
      paymentMethod: PAYMENT_METHOD.COD,
      paymentStatus: PAYMENT_STATUS.PAID,
      orderStatus: ORDER_STATUS.DELIVERED,
      placedAt: daysAgo(9),
      deliveredAt: daysAgo(6),
    });

    /* In flight, so the farmer dashboard has something to act on. */
    const activeItems = [makeItem(mango, 20)];
    await Order.create({
      buyer: buyer._id,
      subOrders: [
        {
          farmer: mango.farmer, farm: mango.farm, items: activeItems,
          subtotal: activeItems[0].subtotal, deliveryFee: 0,
          total: activeItems[0].subtotal,
          status: ORDER_STATUS.CONFIRMED,
          statusHistory: [
            { status: ORDER_STATUS.PLACED, at: daysAgo(2) },
            { status: ORDER_STATUS.CONFIRMED, at: daysAgo(1) },
          ],
        },
      ],
      shippingAddress: address,
      subtotal: activeItems[0].subtotal,
      deliveryFee: 0,
      totalAmount: activeItems[0].subtotal,
      paymentMethod: PAYMENT_METHOD.COD,
      paymentStatus: PAYMENT_STATUS.PENDING,
      orderStatus: ORDER_STATUS.CONFIRMED,
      placedAt: daysAgo(2),
    });

    /* A review, only possible because the order above is delivered. */
    await Review.create({
      buyer: buyer._id,
      product: tomato._id,
      farmer: tomato.farmer,
      order: delivered._id,
      rating: 5,
      comment: "Graded exactly as described and none spoiled in transit. Will order again.",
    });

    const [stats] = await Review.aggregate([
      { $match: { product: tomato._id, isHidden: false } },
      { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    await Product.updateOne(
      { _id: tomato._id },
      { averageRating: stats.average, reviewCount: stats.count }
    );
    await Farm.updateOne(
      { farmer: tomato.farmer },
      { averageRating: stats.average, reviewCount: stats.count }
    );

    logger.info("Orders: 2, Reviews: 1");
  }

  logger.info("Seed complete");
  logger.info("");
  logger.info("  DEVELOPMENT ONLY demo accounts — never use these in production");
  logger.info(`  admin   admin@example.com   / ${PASSWORD}`);
  logger.info(`  farmer  farmer@example.com  / ${PASSWORD}   (approved)`);
  logger.info(`  farmer  gurpreet@example.com / ${PASSWORD}  (pending approval)`);
  logger.info(`  buyer   buyer@example.com   / ${PASSWORD}`);
  logger.info("");

  await disconnectDB();
  process.exit(0);
};

run().catch(async (error) => {
  logger.error("Seed failed", { message: error.message, stack: error.stack });
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
