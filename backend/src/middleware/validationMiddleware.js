import { ZodError } from "zod";
import ApiError from "../utils/ApiError.js";

/**
 * Zod validation for body, query and params.
 *
 * The parsed result replaces the raw input, so controllers only ever see
 * values that have been coerced and stripped — an unexpected field in a
 * request body cannot reach a Mongoose update.
 *
 * `req.query` is a getter in Express 5 and read-only in some setups, so the
 * validated query is assigned to `req.validatedQuery` as well as attempted
 * in place.
 */
const formatIssues = (error) =>
  error.issues.map((issue) => ({
    field: issue.path.join(".") || "(root)",
    message: issue.message,
  }));

export const validate = (schemas) => (req, _res, next) => {
  try {
    if (schemas.params) req.params = schemas.params.parse(req.params);
    if (schemas.body) req.body = schemas.body.parse(req.body ?? {});
    if (schemas.query) {
      const parsed = schemas.query.parse(req.query ?? {});
      req.validatedQuery = parsed;
      try {
        req.query = parsed;
      } catch {
        /* Express 5 exposes req.query as a getter; validatedQuery is used. */
      }
    }
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(
        ApiError.unprocessable("Some fields need attention", "VALIDATION_ERROR", formatIssues(error))
      );
    }
    return next(error);
  }
};

/** Controllers read query params through this so they work under both
 *  Express 4 and 5 without caring which one is running. */
export const getQuery = (req) => req.validatedQuery ?? req.query ?? {};
