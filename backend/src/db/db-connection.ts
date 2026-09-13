import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DEFAULT_DATABASE_NAME = "default.db";
const DEFAULT_MIGRATIONS_DIRECTORY = path.resolve(process.cwd(), "drizzle");

const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.resolve(__dirname, process.env.DB_NAME || DEFAULT_DATABASE_NAME);

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

export function runDatabaseMigrations(): void {
  const migrationsFolder = path.resolve(
    process.env.MIGRATIONS_DIRECTORY || DEFAULT_MIGRATIONS_DIRECTORY
  );
  migrate(db, { migrationsFolder });
}

export { db };
