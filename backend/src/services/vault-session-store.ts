import crypto from "crypto";
import { ACCOUNT_POLICY } from "../constants/account-policy";

interface VaultSession {
  userId: number;
  vaultKey: Buffer;
  expiresAt: number;
}

const SESSION_ID_BYTES = 32;
const MILLISECONDS_PER_SECOND = 1_000;
const sessions = new Map<string, VaultSession>();

function destroySession(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.vaultKey.fill(0);
    sessions.delete(sessionId);
  }
}

function removeExpiredSessions(now = Date.now()): void {
  for (const [sessionId, session] of sessions) {
    if (session.expiresAt <= now) {
      destroySession(sessionId);
    }
  }
}

export function createVaultSession(userId: number, vaultKey: Buffer): string {
  removeExpiredSessions();
  const sessionId = crypto.randomBytes(SESSION_ID_BYTES).toString("base64url");
  sessions.set(sessionId, {
    userId,
    vaultKey: Buffer.from(vaultKey),
    expiresAt:
      Date.now() +
      ACCOUNT_POLICY.SESSION_DURATION_SECONDS * MILLISECONDS_PER_SECOND,
  });
  return sessionId;
}

export function getVaultSession(
  sessionId: string,
  userId: number
): Buffer | undefined {
  removeExpiredSessions();
  const session = sessions.get(sessionId);
  if (!session || session.userId !== userId) {
    return undefined;
  }
  return session.vaultKey;
}

export function destroyVaultSession(sessionId: string): void {
  destroySession(sessionId);
}

export function destroyVaultSessionsForUser(
  userId: number,
  exceptSessionId?: string
): void {
  for (const [sessionId, session] of sessions) {
    if (session.userId === userId && sessionId !== exceptSessionId) {
      destroySession(sessionId);
    }
  }
}
