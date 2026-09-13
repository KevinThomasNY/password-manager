import fs from "fs";
import bcrypt from "bcrypt";
import { AccountStatus, UserRole } from "../src/constants/account-policy";
import { SECURITY_POLICY } from "../src/constants/security-policy";

const databasePath = process.env.DB_PATH!;
fs.rmSync(databasePath, { force: true });
fs.rmSync(process.env.UPLOAD_DIRECTORY!, { force: true, recursive: true });

const { db, runDatabaseMigrations } = require("../src/db/db-connection");
const { users } = require("../src/db/schema");

runDatabaseMigrations();
db.insert(users)
  .values({
    userName: process.env.TEST_USER_NAME!,
    password: bcrypt.hashSync(
      process.env.TEST_USER_PASSWORD!,
      SECURITY_POLICY.BCRYPT_SALT_ROUNDS
    ),
    firstName: "Local",
    lastName: "Admin",
    role: UserRole.Admin,
    status: AccountStatus.Active,
  })
  .run();
