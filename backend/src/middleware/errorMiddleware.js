import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import logger from "../utils/logger.js";
import env from "../config/env.js";

export const notFound = (req, _res, next) => {
  next(ApiError.notFound(`No route matches ${req.method} ${req.originalUrl}`, "ROUTE_NOT_FOUND"));
};

/**
 * The single exit point for every failure.
 *
 * Driver and Mongoose errors are translated into the same public shape as a
 * deliberate ApiError. Anything unrecognised becomes a flat 500: the real
 * message and stack go to the log, never to the client, because an
 * unrecognised error is exactly the kind that leaks internals.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    if (error instanceof mongoose.Error.ValidationError) {
      const details = Object.values(error.errors).map((item) => ({
        field: item.path,
        message: item.message,
      }));
      error = ApiError.unprocessable("Some fields need attention", "VALIDATION_ERROR", details);
    } else if (error instanceof mongoose.Error.CastError) {
      error = ApiError.badRequest(
        `'${error.value}' is not a valid ${error.path}`,
        "INVALID_ID"
      );
    } else if (error?.code === 11000) {
      const field = Object.keys(error.keyPattern ?? {})[0] ?? "value";
      error = ApiError.conflict(`That ${field} is already registered`, "DUPLICATE_KEY");
    } else if (error?.name === "JsonWebTokenError") {
      error = ApiError.unauthorized("Your session is not valid", "INVALID_TOKEN");
    } else if (error?.name === "TokenExpiredError") {
      error = ApiError.unauthorized("Your session has expired, log in again", "TOKEN_EXPIRED");
    } else if (error?.type === "entity.too.large") {
      error = ApiError.badRequest("Request body is too large", "PAYLOAD_TOO_LARGE");
    } else if (error?.type === "entity.parse.failed") {
      error = ApiError.badRequest("Request body is not valid JSON", "INVALID_JSON");
    } else {
      logger.error("Unhandled error", {
        message: error?.message,
        stack: error?.stack,
        path: req.originalUrl,
        method: req.method,
      });
      error = new ApiError(500, "Something went wrong on our side", "INTERNAL_ERROR");
      error.isOperational = false;
    }
  }

  if (error.statusCode >= 500) {
    logger.error("Server error", { message: err?.message, path: req.originalUrl });
  } else {
    logger.debug("Handled error", {
      code: error.errorCode,
      status: error.statusCode,
      path: req.originalUrl,
    });
  }

  const body = {
    success: false,
    message: error.message,
    errorCode: error.errorCode,
  };
  if (error.details) body.details = error.details;
  if (!env.isProd && !error.isOperational) body.stack = err?.stack;

  return res.status(error.statusCode).json(body);
};