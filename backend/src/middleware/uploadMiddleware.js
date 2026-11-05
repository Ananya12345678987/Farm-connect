import multer from "multer";
import ApiError from "../utils/ApiError.js";
import env from "../config/env.js";

/**
 * Files are held in memory and streamed to Cloudinary, never written to the
 * API's disk — the server stays stateless and nothing is left behind if an
 * upload fails halfway.
 *
 * Three checks, in order of cost: extension and declared MIME type here,
 * and a magic-byte check in cloudinaryService before anything is uploaded.
 * A declared Content-Type is a claim by the client, not evidence.
 */

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const ALLOWED_EXT = /\.(jpe?g|png|webp|avif)$/i;

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(
      ApiError.badRequest("Images must be JPEG, PNG, WebP or AVIF", "INVALID_FILE_TYPE")
    );
  }
  if (!ALLOWED_EXT.test(file.originalname)) {
    return cb(ApiError.badRequest("That file extension is not allowed", "INVALID_FILE_TYPE"));
  }
  return cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: env.maxUploadBytes,
    files: env.maxProductImages,
    fields: 24,
    parts: 32,
  },
});

/** Translates multer's own errors into the API's error shape. */
const wrap = (handler) => (req, res, next) =>
  handler(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      const map = {
        LIMIT_FILE_SIZE: `Each image must be under ${env.maxUploadBytes / (1024 * 1024)}MB`,
        LIMIT_FILE_COUNT: `Upload at most ${env.maxProductImages} images`,
        LIMIT_UNEXPECTED_FILE: "Unexpected file field",
      };
      return next(
        ApiError.badRequest(map[error.code] ?? "That upload was rejected", "UPLOAD_REJECTED")
      );
    }
    return next(error);
  });

export const uploadProductImages = wrap(upload.array("images", env.maxProductImages));
export const uploadAvatar = wrap(upload.single("avatar"));

export default upload;
