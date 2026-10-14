/**
 * Every failure the API raises deliberately is an ApiError. The error
 * middleware trusts `isOperational` to decide what the client may see: an
 * ApiError's message is safe to return, anything else is not.
 */
export default class ApiError extends Error {
  constructor(statusCode, message, errorCode = "ERROR", details = undefined) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message, code = "BAD_REQUEST", details) {
    return new ApiError(400, message, code, details);
  }
  static unauthorized(message = "Authentication required", code = "UNAUTHORIZED") {
    return new ApiError(401, message, code);
  }
  static forbidden(message = "You do not have access to this resource", code = "FORBIDDEN") {
    return new ApiError(403, message, code);
  }
  static notFound(message = "Resource not found", code = "NOT_FOUND") {
    return new ApiError(404, message, code);
  }
  static conflict(message, code = "CONFLICT") {
    return new ApiError(409, message, code);
  }
  static unprocessable(message, code = "UNPROCESSABLE", details) {
    return new ApiError(422, message, code, details);
  }
  static tooMany(message = "Too many requests", code = "RATE_LIMITED") {
    return new ApiError(429, message, code);
  }
  static unavailable(message, code = "SERVICE_UNAVAILABLE") {
    return new ApiError(503, message, code);
  }
}