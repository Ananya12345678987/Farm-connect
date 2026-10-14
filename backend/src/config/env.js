import dotenv from "dotenv";

dotenv.config();

/**
 * Environment access happens here and nowhere else, so a missing or wrong
 * variable is handled in one place rather than as an undefined deep inside a
 * request. Later commits add the database URL and JWT secret to this file.
 */

const list = (value) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const clientUrls = list(process.env.CLIENT_URL);

const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProd: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
  port: Number(process.env.PORT ?? 5000),

  /* The frontend origins allowed to call this API. */
  clientUrls: clientUrls.length ? clientUrls : ["http://localhost:5173"],
};

export default env;