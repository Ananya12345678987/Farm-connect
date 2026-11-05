import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";

import env from "./config/env.js";
import logger from "./utils/logger.js";
import apiRoutes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import { generalLimiter } from "./middleware/rateLimiters.js";

/**
 * The Express app, kept separate from the HTTP server so tests can mount it
 * with supertest without opening a port or starting Socket.IO.
 */
const app = express();

/* Behind a proxy (Render, Railway, nginx) this is what makes req.ip and
   secure-cookie detection correct. A specific hop count rather than `true`,
   which would let a client spoof X-Forwarded-For. */
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  helmet({
    /* The API serves JSON, not pages; CSP belongs on the frontend host. */
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

/**
 * CORS with an explicit allow-list. `origin: "*"` is not usable here: the
 * session cookie requires credentials, and browsers refuse credentialed
 * requests against a wildcard origin.
 */
app.use(
  cors({
    origin(origin, callback) {
      /* Same-origin requests, curl and server-to-server calls send no Origin. */
      if (!origin) return callback(null, true);
      if (env.clientUrls.includes(origin)) return callback(null, true);

      logger.warn("Blocked CORS origin", { origin });
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);

/* Hard ceiling on body size. Images do not come through here — they arrive
   as multipart and are capped separately by multer. */
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());
app.use(compression());

/* Strips keys containing $ and . so a body cannot smuggle a Mongo operator
   into a filter. */
app.use(mongoSanitize({ replaceWith: "_" }));
/* Collapses duplicated query parameters, which otherwise arrive as arrays
   and break validators expecting a string. */
app.use(hpp({ whitelist: ["category", "state", "district"] }));

if (!env.isTest) {
  app.use(
    morgan(env.isProd ? "combined" : "dev", {
      stream: { write: (line) => logger.info(line.trim()) },
      /* Health checks would otherwise dominate the log. */
      skip: (req) => req.originalUrl === "/api/health",
    })
  );
}

app.use("/api", generalLimiter);
app.use("/api", apiRoutes);

app.get("/", (_req, res) =>
  res.json({
    success: true,
    message: "FarmConnect API",
    data: { docs: "/api/health", version: "1.0.0" },
  })
);

app.use(notFound);
app.use(errorHandler);

export default app;
