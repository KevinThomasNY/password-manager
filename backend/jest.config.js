const { createDefaultPreset } = require("ts-jest");
const os = require("os");
const path = require("path");

process.env.DB_PATH = path.join(os.tmpdir(), "password-manager-jest.db");
process.env.UPLOAD_DIRECTORY = path.join(
  os.tmpdir(),
  "password-manager-jest-uploads"
);
process.env.MIGRATIONS_DIRECTORY = path.join(__dirname, "drizzle");
process.env.SECRET_KEY = "test-only-jwt-secret";
process.env.ENCRYPTION_KEY = "0".repeat(64);
process.env.TEST_USER_NAME = "local_admin";
process.env.TEST_USER_PASSWORD = "LocalTestPassword123!";

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  setupFiles: ["dotenv/config", "<rootDir>/tests/setup-environment.ts"],
  transform: {
    ...tsJestTransformCfg,
  },
};
