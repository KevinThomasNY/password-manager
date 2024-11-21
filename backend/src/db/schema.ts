import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userName: text("username", { length: 50 }).notNull().unique(),
  password: text("password", { length: 256 }).notNull(),
  firstName: text("first_name", { length: 50 }).notNull(),
  lastName: text("last_name", { length: 50 }).notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text("last_updated")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const passwords = sqliteTable("passwords", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
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

export const securityQuestions = sqliteTable("security_questions", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  passwordId: integer("password_id")
    .notNull()
    .references(() => passwords.id, { onDelete: "cascade" }),
  question: text("question", { length: 256 }).notNull(),
  answer: text("answer", { length: 256 }).notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const userLoginHistory = sqliteTable("user_login_history", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  loginTime: text("login_time")
    .notNull()
    .default(sql`(current_timestamp)`),
  ipAddress: text("ip_address").notNull(),
});
