import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";
import { SECURITY_POLICY } from "../constants/security-policy";
import { AccountStatus, UserRole } from "../constants/account-policy";

export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userName: text("username", {
    length: SECURITY_POLICY.USERNAME_MAX_LENGTH,
  }).notNull().unique(),
  password: text("password", {
    length: SECURITY_POLICY.MASTER_PASSWORD_MAX_LENGTH,
  }).notNull(),
  firstName: text("first_name", {
    length: SECURITY_POLICY.PROFILE_NAME_MAX_LENGTH,
  }).notNull(),
  lastName: text("last_name", {
    length: SECURITY_POLICY.PROFILE_NAME_MAX_LENGTH,
  }).notNull(),
  role: text("role").$type<UserRole>().notNull().default(UserRole.User),
  status: text("status")
    .$type<AccountStatus>()
    .notNull()
    .default(AccountStatus.Active),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text("last_updated")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const invitations = sqliteTable("invitations", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  tokenHash: text("token_hash").notNull().unique(),
  createdByUserId: integer("created_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  consumedByUserId: integer("consumed_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  expiresAt: text("expires_at").notNull(),
  consumedAt: text("consumed_at"),
  revokedAt: text("revoked_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const passwords = sqliteTable("passwords", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name", {
    length: SECURITY_POLICY.VAULT_ENTRY_NAME_MAX_LENGTH,
  }).notNull(),
  password: text("password", {
    length: SECURITY_POLICY.ENCRYPTED_VALUE_MAX_LENGTH,
  }).notNull(),
  image: text("image", { length: SECURITY_POLICY.STORED_IMAGE_PATH_MAX_LENGTH }),
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
  question: text("question", {
    length: SECURITY_POLICY.SECURITY_QUESTION_MAX_LENGTH,
  }).notNull(),
  answer: text("answer", {
    length: SECURITY_POLICY.ENCRYPTED_VALUE_MAX_LENGTH,
  }).notNull(),
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
