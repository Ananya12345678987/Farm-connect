import cloudinary, { isEnabled } from "../config/cloudinary.js";
import ApiError from "../utils/ApiError.js";
import logger from "../utils/logger.js";
import env from "../config/env.js";

/**
 * Cloudinary upload and deletion.
 *
 * Two things matter here. First, a buffer is verified by its magic bytes
 * before it leaves the process — a .png extension and an image/png header
 * are both client claims, the first four bytes are not. Second, if any image
 * in a batch fails, the ones that already succeeded are deleted before the
 * error propagates, so a product is never created referencing a partial set.
 */

const SIGNATURES = [
  { name: "jpeg", bytes: [0xff, 0xd8, 0xff] },
  { name: "png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { name: "webp", bytes: [0x52, 0x49, 0x46, 0x46] },
  { name: "avif", bytes: [0x00, 0x00, 0x00], offset: 0 },
];

const looksLikeImage = (buffer) => {
  if (!buffer || buffer.length < 12) return false;

  const matches = (sig) =>
    sig.bytes.every((byte, index) => buffer[(sig.offset ?? 0) + index] === byte);

  if (SIGNATURES.slice(0, 3).some(matches)) return true;
  /* AVIF and HEIF carry an 'ftyp' box at offset 4. */
  return buffer.slice(4, 8).toString("ascii") === "ftyp";
};

const assertEnabled = () => {
  if (!isEnabled()) {
    throw ApiError.unavailable(
      "Image uploads are not configured on this server",
      "UPLOADS_DISABLED"
    );
  }
};

const uploadBuffer = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        /* Re-encode server-side. This strips EXIF (including GPS) and
           normalises anything unusual that got past the header check. */
        transformation: [
          { width: 1600, height: 1600, crop: "limit" },
          { quality: "auto:good", fetch_format: "auto" },
        ],
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });

export const destroyImage = async (publicId) => {
  if (!publicId || !isEnabled()) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    /* A dangling remote file is not worth failing the user's request over. */
    logger.warn("Cloudinary delete failed", { publicId, message: error.message });
  }
};

export const destroyMany = async (publicIds = []) => {
  await Promise.all(publicIds.filter(Boolean).map(destroyImage));
};

/**
 * Uploads a batch, all-or-nothing.
 * @returns {Promise<Array<{url, publicId, width, height}>>}
 */
export const uploadImages = async (files = [], folder = "farmconnect/products") => {
  assertEnabled();

  if (!files.length) {
    throw ApiError.badRequest("Attach at least one image", "NO_IMAGES");
  }
  if (files.length > env.maxProductImages) {
    throw ApiError.badRequest(
      `Upload at most ${env.maxProductImages} images`,
      "TOO_MANY_IMAGES"
    );
  }

  files.forEach((file) => {
    if (!looksLikeImage(file.buffer)) {
      throw ApiError.badRequest(
        `"${file.originalname}" is not a real image file`,
        "INVALID_FILE_CONTENT"
      );
    }
  });

  const uploaded = [];
  try {
    for (const file of files) {
      // eslint-disable-next-line no-await-in-loop
      const result = await uploadBuffer(file.buffer, folder);
      uploaded.push({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      });
    }
    return uploaded;
  } catch (error) {
    await destroyMany(uploaded.map((image) => image.publicId));
    logger.error("Cloudinary upload failed", { message: error.message });
    throw ApiError.unavailable(
      "Image upload failed. Nothing was saved — try again.",
      "UPLOAD_FAILED"
    );
  }
};

export const uploadSingle = async (file, folder) => {
  const [image] = await uploadImages([file], folder);
  return image;
};
