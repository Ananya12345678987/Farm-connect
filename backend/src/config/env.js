import dotenv from "dotenv";

dotenv.config();

/**
 * Environment access happens here and nowhere else, so a missing variable
 * fails loudly at boot rather than as an undefined deep inside a request.
 */

const required = ["MONGODB_URI", "JWT_SECRET"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(
    `[config] Missing required environment variables: ${missing.join(", ")}\n` +
      "Copy .env.example to .env and fill them in."
  );
  process.exit(1);
}

if (process.env.NODE_ENV === "production" && process.env.JWT_SECRET.length < 32) {
  console.error("[config] JWT_SECRET must be at least 32 characters in production.");
  process.exit(1);
}

const list = (value) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const clientUrls = list(process.env.CLIENT_URL);
const socketOrigins = list(process.env.SOCKET_ORIGIN);
const fallbackOrigin = ["http://localhost:5173"];

const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProd: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
  port: Number(process.env.PORT ?? 5000),

  mongoUri: process.env.MONGODB_URI,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",

  clientUrls: clientUrls.length ? clientUrls : fallbackOrigin,
  socketOrigins: socketOrigins.length
    ? socketOrigins
    : clientUrls.length
      ? clientUrls
      : fallbackOrigin,

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  },

  adminSetupKey: process.env.ADMIN_SETUP_KEY ?? "",
  seedPassword: process.env.SEED_PASSWORD ?? "Farm@1234",

  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 12),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_SIZE_MB ?? 5) * 1024 * 1024,
  maxProductImages: Number(process.env.MAX_PRODUCT_IMAGES ?? 5),
};

env.cloudinaryEnabled = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret
);

export default env;
