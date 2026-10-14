/**
 * Wraps an async route handler so a rejected promise reaches Express's error
 * middleware instead of hanging the request. Every controller is wrapped.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;