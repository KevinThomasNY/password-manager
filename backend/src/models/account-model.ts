import bcrypt from "bcrypt";
import crypto from "crypto";
import { and, asc, count, eq, isNull } from "drizzle-orm";
import {
  ACCOUNT_POLICY,
  AccountStatus,
  InvitationStatus,
  UserRole,
} from "../constants/account-policy";
import { SECURITY_POLICY } from "../constants/security-policy";
import { VaultEncryptionVersion } from "../constants/encryption-policy";
import { db } from "../db/db-connection";
import { invitations, users } from "../db/schema";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../middleware/error-middleware";
import { createVaultKeyMaterial } from "../utils/crypto";

export interface NewAccountInput {
  userName: string;
  password: string;
  firstName: string;
  lastName: string;
}

function hashInvitationToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

function createPasswordHash(password: string): Promise<string> {
  return bcrypt.hash(password, SECURITY_POLICY.BCRYPT_SALT_ROUNDS);
}

function invitationFailure(): ValidationError {
  return new ValidationError("Invitation is invalid or expired");
}

export async function isSetupRequired(): Promise<boolean> {
  const [result] = await db.select({ value: count() }).from(users);
  return result.value === 0;
}

export async function createInitialAdmin(input: NewAccountInput) {
  const [passwordHash, vault] = await Promise.all([
    createPasswordHash(input.password),
    createVaultKeyMaterial(input.password),
  ]);

  try {
    return db.transaction((transaction) => {
      const [existingUser] = transaction
        .select({ id: users.id })
        .from(users)
        .limit(1)
        .all();
      if (existingUser) {
        throw new ConflictError("Initial setup has already been completed");
      }

      const [admin] = transaction
        .insert(users)
        .values({
          ...input,
          password: passwordHash,
          role: UserRole.Admin,
          status: AccountStatus.Active,
          wrappedVaultKey: vault.wrappedVaultKey,
          vaultKeySalt: vault.vaultKeySalt,
          vaultEncryptionVersion: VaultEncryptionVersion.EnvelopeV1,
        })
        .returning({
          id: users.id,
          userName: users.userName,
          role: users.role,
          status: users.status,
        })
        .all();

      return admin;
    });
  } finally {
    vault.vaultKey.fill(0);
  }
}

export async function createInvitation(
  createdByUserId: number,
  lifetimeHours: number
) {
  const token = crypto
    .randomBytes(ACCOUNT_POLICY.INVITATION_TOKEN_BYTES)
    .toString("base64url");
  const expiresAt = new Date(
    Date.now() + lifetimeHours * ACCOUNT_POLICY.MILLISECONDS_PER_HOUR
  ).toISOString();

  const [invitation] = await db
    .insert(invitations)
    .values({
      tokenHash: hashInvitationToken(token),
      createdByUserId,
      expiresAt,
    })
    .returning({ id: invitations.id, expiresAt: invitations.expiresAt });

  return { ...invitation, token };
}

export async function consumeInvitation(
  token: string,
  input: NewAccountInput
) {
  const [passwordHash, vault] = await Promise.all([
    createPasswordHash(input.password),
    createVaultKeyMaterial(input.password),
  ]);
  const tokenHash = hashInvitationToken(token);
  const now = new Date();
  const nowIso = now.toISOString();

  try {
    return db.transaction((transaction) => {
      const [invitation] = transaction
        .select()
        .from(invitations)
        .where(
          and(
            eq(invitations.tokenHash, tokenHash),
            isNull(invitations.consumedAt),
            isNull(invitations.revokedAt)
          )
        )
        .limit(1)
        .all();

      if (!invitation || new Date(invitation.expiresAt) <= now) {
        throw invitationFailure();
      }

      const [existingUser] = transaction
        .select({ id: users.id })
        .from(users)
        .where(eq(users.userName, input.userName))
        .limit(1)
        .all();
      if (existingUser) {
        throw new ConflictError("Username is unavailable");
      }

      const [user] = transaction
        .insert(users)
        .values({
          ...input,
          password: passwordHash,
          role: UserRole.User,
          status: AccountStatus.Active,
          wrappedVaultKey: vault.wrappedVaultKey,
          vaultKeySalt: vault.vaultKeySalt,
          vaultEncryptionVersion: VaultEncryptionVersion.EnvelopeV1,
        })
        .returning({
          id: users.id,
          userName: users.userName,
          role: users.role,
          status: users.status,
        })
        .all();

      transaction
        .update(invitations)
        .set({ consumedAt: nowIso, consumedByUserId: user.id })
        .where(eq(invitations.id, invitation.id))
        .run();

      return user;
    });
  } finally {
    vault.vaultKey.fill(0);
  }
}

export async function listInvitations() {
  const records = await db
    .select({
      id: invitations.id,
      expiresAt: invitations.expiresAt,
      consumedAt: invitations.consumedAt,
      revokedAt: invitations.revokedAt,
      createdAt: invitations.createdAt,
    })
    .from(invitations)
    .orderBy(asc(invitations.id));

  const now = new Date();
  return records.map((record) => ({
    id: record.id,
    expiresAt: record.expiresAt,
    createdAt: record.createdAt,
    status: record.consumedAt
      ? InvitationStatus.Used
      : record.revokedAt
        ? InvitationStatus.Revoked
        : new Date(record.expiresAt) <= now
          ? InvitationStatus.Expired
          : InvitationStatus.Active,
  }));
}

export async function revokeInvitation(invitationId: number): Promise<void> {
  const [invitation] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.id, invitationId));

  if (!invitation) {
    throw new NotFoundError("Invitation not found");
  }
  if (invitation.consumedAt) {
    throw new ConflictError("A used invitation cannot be revoked");
  }
  if (!invitation.revokedAt) {
    await db
      .update(invitations)
      .set({ revokedAt: new Date().toISOString() })
      .where(eq(invitations.id, invitationId));
  }
}

export async function listUsers() {
  return db
    .select({
      id: users.id,
      userName: users.userName,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.id));
}

export async function updateManagedUser(
  actingUserId: number,
  targetUserId: number,
  updates: { role?: UserRole; status?: AccountStatus }
) {
  return db.transaction((transaction) => {
    const [target] = transaction
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .all();
    if (!target) {
      throw new NotFoundError("User not found");
    }

    const removesAdminAccess =
      target.role === UserRole.Admin &&
      target.status === AccountStatus.Active &&
      (updates.role === UserRole.User ||
        (updates.status !== undefined &&
          updates.status !== AccountStatus.Active));

    if (actingUserId === targetUserId && removesAdminAccess) {
      throw new ForbiddenError(
        "You cannot remove your own administrator access"
      );
    }

    if (removesAdminAccess) {
      const [activeAdminCount] = transaction
        .select({ value: count() })
        .from(users)
        .where(
          and(
            eq(users.role, UserRole.Admin),
            eq(users.status, AccountStatus.Active)
          )
        )
        .all();
      if (activeAdminCount.value <= 1) {
        throw new ConflictError("At least one active administrator is required");
      }
    }

    const [updatedUser] = transaction
      .update(users)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(users.id, targetUserId))
      .returning({
        id: users.id,
        userName: users.userName,
        role: users.role,
        status: users.status,
      })
      .all();

    return updatedUser;
  });
}

export async function promoteUserForRecovery(userName: string) {
  const [user] = await db
    .update(users)
    .set({
      role: UserRole.Admin,
      status: AccountStatus.Active,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.userName, userName))
    .returning({ id: users.id, userName: users.userName });

  if (!user) {
    throw new NotFoundError("User not found");
  }
  return user;
}

export async function createRecoveryAdmin(input: NewAccountInput) {
  const [passwordHash, vault] = await Promise.all([
    createPasswordHash(input.password),
    createVaultKeyMaterial(input.password),
  ]);
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.userName, input.userName));
  if (existingUser) {
    throw new ConflictError("Username is unavailable");
  }

  try {
    const [admin] = await db
      .insert(users)
      .values({
        ...input,
        password: passwordHash,
        role: UserRole.Admin,
        status: AccountStatus.Active,
        wrappedVaultKey: vault.wrappedVaultKey,
        vaultKeySalt: vault.vaultKeySalt,
        vaultEncryptionVersion: VaultEncryptionVersion.EnvelopeV1,
      })
      .returning({ id: users.id, userName: users.userName });
    return admin;
  } finally {
    vault.vaultKey.fill(0);
  }
}
