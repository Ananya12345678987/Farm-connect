import http from "node:http";

import app from "./app.js";
import env from "./config/env.js";
import logger from "./utils/logger.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { initSocket, closeSocket } from "./config/socket.js";

/**
 * Boot order matters: the database is connected before the port is opened,
 * so the server never accepts a request it cannot serve. A failed connection
 * exits rather than leaving a process up that returns 500 to everything.
 */

const server = http.createServer(app);

const start = async () => {
  try {
    await connectDB();
  } catch (error) {
    logger.error("Could not connect to MongoDB — not starting the server", {
      message: error.message,
    });
    process.exit(1);
  }

  initSocket(server);

  server.listen(env.port, () => {
    logger.info(`FarmConnect API listening on http://localhost:${env.port}`);
    logger.info(`Allowed origins: ${env.clientUrls.join(", ")}`);
  });
};

/**
 * Graceful shutdown: stop accepting connections, close sockets, close the
 * database, then exit. The timeout is a backstop so a hung connection cannot
 * keep the process alive forever during a deploy.
 */
let shuttingDown = false;

const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received — shutting down`);

  const force = setTimeout(() => {
    logger.error("Shutdown timed out, forcing exit");
    process.exit(1);
  }, 10000);
  force.unref();

  try {
    await new Promise((resolve) => server.close(resolve));
    await closeSocket();
    await disconnectDB();
    clearTimeout(force);
    logger.info("Shutdown complete");
    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown", { message: error.message });
    process.exit(1);
  }
};

["SIGTERM", "SIGINT"].forEach((signal) => process.on(signal, () => shutdown(signal)));

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { message: reason?.message ?? String(reason) });
  shutdown("unhandledRejection");
});

process.on("uncaughtException", (error) => {
  /* The process is in an unknown state; log and go down rather than serve
     requests from a corrupted runtime. */
  logger.error("Uncaught exception", { message: error.message, stack: error.stack });
  process.exit(1);
});

start();

export default server;
