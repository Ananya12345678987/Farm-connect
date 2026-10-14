import app from "./app.js";
import env from "./config/env.js";
import logger from "./utils/logger.js";

app.listen(env.port, () => {
  logger.info(`FarmConnect API listening on http://localhost:${env.port}`);
  logger.info(`Allowed origins: ${env.clientUrls.join(", ")}`);
});