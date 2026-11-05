import { v2 as cloudinary } from "cloudinary";
import env from "./env.js";
import logger from "../utils/logger.js";

/**
 * Configured only when all three credentials are present. When they are not,
 * `isEnabled` stays false and the upload routes return a clear 503 rather
 * than letting a product be created in a half-finished image state.
 */

let configured = false;

if (env.cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
  configured = true;
  logger.info("Cloudinary configured");
} else {
  logger.warn("Cloudinary credentials absent — image upload endpoints are disabled");
}

export const isEnabled = () => configured;
export default cloudinary;
