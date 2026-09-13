export enum VaultEncryptionVersion {
  Legacy = "legacy",
  EnvelopeV1 = "envelope-v1",
}

export enum VaultValuePurpose {
  Password = "password",
  SecurityAnswer = "security-answer",
  WrappedVaultKey = "wrapped-vault-key",
}

export const ENCRYPTION_POLICY = {
  AES_ALGORITHM: "aes-256-gcm",
  LEGACY_AES_ALGORITHM: "aes-256-cbc",
  LEGACY_FORMAT_VERSION: "v2",
  VAULT_FORMAT_VERSION: "v3",
  WRAPPED_KEY_FORMAT_VERSION: "wk1",
  KEY_BYTES: 32,
  GCM_NONCE_BYTES: 12,
  GCM_AUTH_TAG_BYTES: 16,
  LEGACY_IV_BYTES: 16,
  KDF_SALT_BYTES: 16,
  ARGON2_MEMORY_COST_KIB: 19_456,
  ARGON2_TIME_COST: 2,
  ARGON2_PARALLELISM: 1,
} as const;
