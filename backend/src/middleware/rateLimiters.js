import rateLimit from "express-rate-limit";
import env from "../config/env.js";

const handler = (_req, res) =>
  res.status(429).json({
    success: false,
    message: "Too many requests. Wait a minute and try again.",
    errorCode: "RATE_LIMITED",
  });

const base = {
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  /* Limits would make the test suite flaky and mean nothing there. */
  skip: () => env.isTest,
};

/** Broad ceiling for the whole API. */
export const generalLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 600 });

/** Tight, because this is where credential stuffing happens. */
export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
});

/** Uploads cost money and bandwidth. */
export const uploadLimiter = rateLimit({ ...base, windowMs: 60 * 60 * 1000, limit: 60 });

/** Stops a scripted account from flooding a thread. */
export const writeLimiter = rateLimit({ ...base, windowMs: 60 * 1000, limit: 60 });
