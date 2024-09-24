import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  userName: text("username", { length: 50 }).notNull().unique(),
  password: text("password", { length: 50 }).notNull(),
  firstName: text("first_name", { length: 50 }).notNull(),
  lastName: text("last_name", { length: 50 }).notNull(),
});
