import jwt from "jsonwebtoken";
import env from "../config/env.js";

/**
 * The JWT carries the two things authorisation needs and nothing else: who
 * the user is and what role they hold. No email, no name, no farm id —
 * a token is readable by anyone holding it.
 *
 * Role is re-read from the database on every protected request anyway
 * (see authMiddleware), so a role change or suspension takes effect
 * immediately rather than when the token expires.
 */

export const signToken = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    issuer: "farmconnect",
  });

export const verifyToken = (token) =>
  jwt.verify(token, env.jwtSecret, { issuer: "farmconnect" });

export const COOKIE_NAME = "fc_token";

/** Cookie options. sameSite=lax works for same-site dev; cross-site
 *  deployments need sameSite=none, which requires secure=true. */
export const cookieOptions = () => ({
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});
