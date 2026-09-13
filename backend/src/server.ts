import app from "./app";
import { runDatabaseMigrations } from "./db/db-connection";
import logger from "./utils/logger";

const DEFAULT_PORT = 3000;
const port = Number(process.env.PORT) || DEFAULT_PORT;

try {
  runDatabaseMigrations();
  app.listen(port, (error?: Error) => {
    if (error) {
      logger.error(`Server failed to listen on port ${port}: ${error.message}`);
      process.exitCode = 1;
      return;
    }

    logger.info(`Server started on port ${port}`);
  });
} catch (error) {
  logger.error(`Server startup failed: ${String(error)}`);
  process.exit(1);
}
