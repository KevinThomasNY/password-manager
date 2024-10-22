import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  userName: text("username", { length: 50 }).notNull().unique(),
  password: text("password", { length: 256 }).notNull(),
  firstName: text("first_name", { length: 50 }).notNull(),
  lastName: text("last_name", { length: 50 }).notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const passwords = sqliteTable("passwords", {
  id: integer("id").primaryKey(),
  name: text("name", { length: 100 }).notNull(),
  password: text("password", { length: 256 }).notNull(),
  image: text("image", { length: 256 }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});
