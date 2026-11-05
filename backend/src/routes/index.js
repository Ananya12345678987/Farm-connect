import { Router } from "express";
import mongoose from "mongoose";

import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import productRoutes from "./productRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import cartRoutes from "./cartRoutes.js";
import orderRoutes from "./orderRoutes.js";
import reviewRoutes from "./reviewRoutes.js";
import wishlistRoutes from "./wishlistRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import messageRoutes from "./messageRoutes.js";
import reportRoutes from "./reportRoutes.js";
import adminRoutes from "./adminRoutes.js";
import { publicFarmerRouter, farmerWorkspaceRouter } from "./farmerRoutes.js";
import { buyerProfileRouter, buyerWorkspaceRouter } from "./buyerRoutes.js";
import { dbState } from "../config/db.js";
import { isEnabled as cloudinaryReady } from "../config/cloudinary.js";

const router = Router();

/** GET /api/health */
router.get("/health", (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  return res.status(connected ? 200 : 503).json({
    success: connected,
    message: connected
      ? "FarmConnect API is running"
      : "FarmConnect API is running but the database is unreachable",
    data: {
      database: dbState(),
      uploads: cloudinaryReady() ? "enabled" : "disabled",
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);

router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);

router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/reviews", reviewRoutes);
router.use("/wishlist", wishlistRoutes);

router.use("/notifications", notificationRoutes);
/* Both mount points exist because the two names read naturally in different
   places; they are the same router, not a duplicate implementation. */
router.use("/conversations", messageRoutes);
router.use("/messages", messageRoutes);

router.use("/reports", reportRoutes);

router.use("/farmers", publicFarmerRouter);
router.use("/farmer", farmerWorkspaceRouter);
router.use("/buyers", buyerProfileRouter);
router.use("/buyer", buyerWorkspaceRouter);

router.use("/admin", adminRoutes);

export default router;
