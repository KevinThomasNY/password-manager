import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
import { users } from "./schema";

const dbPath = path.resolve(__dirname, "sqlite.db");

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

const result = db.select().from(users).all();
console.log(result);

export { db };
