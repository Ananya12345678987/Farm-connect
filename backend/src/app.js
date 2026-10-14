import express from "express";

/**
 * The Express app, kept separate from the HTTP server (server.js) so that
 * tests can use it later without opening a port.
 */
const app = express();

/** GET /api/health: a quick way to see that the API is up. */
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "FarmConnect API is running",
    data: {
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
});

export default app;