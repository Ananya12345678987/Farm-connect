import express from "express";

import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import { ok } from "./utils/ApiResponse.js";

/**
 * The Express app, kept separate from the HTTP server (server.js) so that
 * tests can use it later without opening a port.
 */
const app = express();

app.disable("x-powered-by");

/* Hard ceiling on body size. Images do not come through here — they arrive
   as multipart and are capped separately by the upload middleware. */
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

/** GET /api/health: a quick way to see that the API is up. */
app.get("/api/health", (_req, res) =>
  ok(res, {
    message: "FarmConnect API is running",
    data: {
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  })
);

/* These two must stay last: anything no route claimed becomes a 404, and any
   error thrown anywhere above ends up in the error handler. */
app.use(notFound);
app.use(errorHandler);

export default app;