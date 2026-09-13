export enum AccountStatus {
  Active = "active",
  Disabled = "disabled",
  Locked = "locked",
}

export enum UserRole {
  Admin = "admin",
  User = "user",
}

export enum InvitationStatus {
  Active = "active",
  Expired = "expired",
  Revoked = "revoked",
  Used = "used",
}

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;
const MILLISECONDS_PER_MINUTE = 60 * 1000;

export const ACCOUNT_POLICY = Object.freeze({
  AUTH_ATTEMPT_LIMIT: 10,
  AUTH_RATE_LIMIT_WINDOW_MS: 15 * MILLISECONDS_PER_MINUTE,
  DEFAULT_INVITATION_LIFETIME_HOURS: 24,
  INVITATION_TOKEN_BYTES: 32,
  INVITATION_TOKEN_MAX_LENGTH: 128,
  INVITATION_LIFETIME_OPTIONS_HOURS: Object.freeze([24, 72, 168]),
  MAX_INVITATION_LIFETIME_HOURS: 168,
  MIN_INVITATION_LIFETIME_HOURS: 1,
  MILLISECONDS_PER_HOUR,
  REGISTRATION_ATTEMPT_LIMIT: 5,
  SESSION_DURATION_SECONDS: 60 * 60,
});
