import env from "../config/env.js";

/**
 * Small structured logger. Deliberately not a dependency: the API needs
 * levelled, JSON-in-production output and nothing more.
 *
 * `redact` strips anything that must never reach a log line — passwords,
 * tokens, secrets — including when an object is logged wholesale.
 */

const SECRET_KEYS = /^(password|passwordHash|token|jwt|secret|authorization|apiSecret|api_key)$/i;

const redact = (value, depth = 0) => {
  if (depth > 4 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));

  return Object.fromEntries(
    Object.entries(value).map(([key, val]) =>
      SECRET_KEYS.test(key) ? [key, "[redacted]"] : [key, redact(val, depth + 1)]
    )
  );
};

const emit = (level, message, meta) => {
  if (env.isTest && level !== "error") return;

  const payload = meta === undefined ? undefined : redact(meta);

  if (env.isProd) {
    console[level === "debug" ? "log" : level](
      JSON.stringify({ level, time: new Date().toISOString(), message, ...(payload ? { meta: payload } : {}) })
    );
    return;
  }

  const tag = { info: "info", warn: "warn", error: "error", debug: "debug" }[level];
  console[level === "debug" ? "log" : level](`[${tag}] ${message}`, payload ?? "");
};

const logger = {
  info: (message, meta) => emit("info", message, meta),
  warn: (message, meta) => emit("warn", message, meta),
  error: (message, meta) => emit("error", message, meta),
  debug: (message, meta) => {
    if (!env.isProd) emit("debug", message, meta);
  },
};

export default logger;