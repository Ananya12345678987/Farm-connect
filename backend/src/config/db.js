import mongoose from "mongoose";
import env from "./env.js";
import logger from "../utils/logger.js";

/**
 * Transactions need a replica set. Atlas and a local `rs` have one; a plain
 * standalone mongod does not. Rather than crash on every checkout, the API
 * detects support once at startup and the order service falls back to a
 * compensating path when it is absent (see services/orderService.js).
 */
let transactionsSupported = false;

export const supportsTransactions = () => transactionsSupported;

const detectTransactionSupport = async () => {
  try {
    const admin = mongoose.connection.db.admin();
    const info = await admin.command({ hello: 1 });
    transactionsSupported = Boolean(info.setName || info.msg === "isdbgrid");
  } catch {
    transactionsSupported = false;
  }

  logger.info(
    transactionsSupported
      ? "MongoDB replica set detected — order creation will use transactions"
      : "MongoDB standalone detected — order creation will use the compensating path"
  );
};

export const connectDB = async (uri = env.mongoUri) => {
  mongoose.set("strictQuery", true);
  /* Fail a query rather than buffer it forever if the connection drops. */
  mongoose.set("bufferTimeoutMS", 8000);

  mongoose.connection.on("error", (error) => {
    logger.error("MongoDB connection error", { message: error.message });
  });
  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 20,
  });

  await detectTransactionSupport();
  logger.info(`MongoDB connected: ${mongoose.connection.name}`);

  return mongoose.connection;
};

export const disconnectDB = async () => {
  await mongoose.connection.close();
  logger.info("MongoDB connection closed");
};

export const dbState = () =>
  ["disconnected", "connected", "connecting", "disconnecting"][
    mongoose.connection.readyState
  ] ?? "unknown";

export default connectDB;
