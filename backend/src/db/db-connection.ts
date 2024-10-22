import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";

const dbName = process.env.DB_NAME || "default.db";
const dbPath = path.resolve(__dirname, dbName);

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

export { db };
