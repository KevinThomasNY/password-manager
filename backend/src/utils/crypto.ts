import crypto from "crypto";
import argon2 from "argon2";
import {
  ENCRYPTION_POLICY,
  VaultValuePurpose,
} from "../constants/encryption-policy";

export interface VaultKeyMaterial {
  vaultKey: Buffer;
  wrappedVaultKey: string;
  vaultKeySalt: string;
}

function authenticatedContext(userId: number, purpose: VaultValuePurpose) {
  return Buffer.from(
    `password-manager:${ENCRYPTION_POLICY.VAULT_FORMAT_VERSION}:${userId}:${purpose}`,
    "utf8"
  );
}

function encryptWithKey(
  plaintext: string | Buffer,
  key: Buffer,
  version: string,
  context: Buffer
): string {
  const nonce = crypto.randomBytes(ENCRYPTION_POLICY.GCM_NONCE_BYTES);
  const cipher = crypto.createCipheriv(
    ENCRYPTION_POLICY.AES_ALGORITHM,
    key,
    nonce
  );
  cipher.setAAD(context);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext),
    cipher.final(),
  ]);

  return [
    version,
    nonce.toString("hex"),
    cipher.getAuthTag().toString("hex"),
    ciphertext.toString("hex"),
  ].join(":");
}

function decryptWithKey(
  encryptedValue: string,
  key: Buffer,
  expectedVersion: string,
  context: Buffer
): Buffer {
  const [version, nonceHex, authTagHex, ciphertextHex, extra] =
    encryptedValue.split(":");
  if (version !== expectedVersion || extra !== undefined) {
    throw new Error("Invalid encrypted value format");
  }

  const nonce = Buffer.from(nonceHex || "", "hex");
  const authTag = Buffer.from(authTagHex || "", "hex");
  const ciphertext = Buffer.from(ciphertextHex || "", "hex");
  if (
    nonce.length !== ENCRYPTION_POLICY.GCM_NONCE_BYTES ||
    authTag.length !== ENCRYPTION_POLICY.GCM_AUTH_TAG_BYTES
  ) {
    throw new Error("Invalid encrypted value format");
  }

  const decipher = crypto.createDecipheriv(
    ENCRYPTION_POLICY.AES_ALGORITHM,
    key,
    nonce
  );
  decipher.setAAD(context);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

async function deriveKey(masterPassword: string, salt: Buffer): Promise<Buffer> {
  return argon2.hash(masterPassword, {
    type: argon2.argon2id,
    salt,
    hashLength: ENCRYPTION_POLICY.KEY_BYTES,
    memoryCost: ENCRYPTION_POLICY.ARGON2_MEMORY_COST_KIB,
    timeCost: ENCRYPTION_POLICY.ARGON2_TIME_COST,
    parallelism: ENCRYPTION_POLICY.ARGON2_PARALLELISM,
    raw: true,
  });
}

export function encryptVaultValue(
  plaintext: string,
  vaultKey: Buffer,
  userId: number,
  purpose: VaultValuePurpose
): string {
  return encryptWithKey(
    plaintext,
    vaultKey,
    ENCRYPTION_POLICY.VAULT_FORMAT_VERSION,
    authenticatedContext(userId, purpose)
  );
}

export function decryptVaultValue(
  encryptedValue: string,
  vaultKey: Buffer,
  userId: number,
  purpose: VaultValuePurpose
): string {
  return decryptWithKey(
    encryptedValue,
    vaultKey,
    ENCRYPTION_POLICY.VAULT_FORMAT_VERSION,
    authenticatedContext(userId, purpose)
  ).toString("utf8");
}

export async function wrapVaultKey(
  vaultKey: Buffer,
  masterPassword: string
): Promise<Omit<VaultKeyMaterial, "vaultKey">> {
  const salt = crypto.randomBytes(ENCRYPTION_POLICY.KDF_SALT_BYTES);
  const wrappingKey = await deriveKey(masterPassword, salt);
  try {
    return {
      wrappedVaultKey: encryptWithKey(
        vaultKey,
        wrappingKey,
        ENCRYPTION_POLICY.WRAPPED_KEY_FORMAT_VERSION,
        Buffer.from(VaultValuePurpose.WrappedVaultKey, "utf8")
      ),
      vaultKeySalt: salt.toString("hex"),
    };
  } finally {
    wrappingKey.fill(0);
  }
}

export async function createVaultKeyMaterial(
  masterPassword: string
): Promise<VaultKeyMaterial> {
  const vaultKey = crypto.randomBytes(ENCRYPTION_POLICY.KEY_BYTES);
  try {
    const wrapped = await wrapVaultKey(vaultKey, masterPassword);
    return { vaultKey, ...wrapped };
  } catch (error) {
    vaultKey.fill(0);
    throw error;
  }
}

export async function unwrapVaultKey(
  wrappedVaultKey: string,
  vaultKeySalt: string,
  masterPassword: string
): Promise<Buffer> {
  const salt = Buffer.from(vaultKeySalt, "hex");
  if (salt.length !== ENCRYPTION_POLICY.KDF_SALT_BYTES) {
    throw new Error("Invalid vault key salt");
  }
  const wrappingKey = await deriveKey(masterPassword, salt);
  try {
    const vaultKey = decryptWithKey(
      wrappedVaultKey,
      wrappingKey,
      ENCRYPTION_POLICY.WRAPPED_KEY_FORMAT_VERSION,
      Buffer.from(VaultValuePurpose.WrappedVaultKey, "utf8")
    );
    if (vaultKey.length !== ENCRYPTION_POLICY.KEY_BYTES) {
      throw new Error("Invalid vault key");
    }
    return vaultKey;
  } finally {
    wrappingKey.fill(0);
  }
}

function getLegacyEncryptionKey(): Buffer {
  const keyValue = process.env.ENCRYPTION_KEY;
  if (!keyValue) {
    throw new Error("Legacy encrypted data requires ENCRYPTION_KEY");
  }
  const key = Buffer.from(keyValue, "hex");
  if (key.length !== ENCRYPTION_POLICY.KEY_BYTES) {
    throw new Error("Invalid legacy encryption key");
  }
  return key;
}

export function decryptLegacyValue(encryptedValue: string): string {
  const key = getLegacyEncryptionKey();
  try {
    if (
      encryptedValue.startsWith(
        `${ENCRYPTION_POLICY.LEGACY_FORMAT_VERSION}:`
      )
    ) {
      return decryptWithKey(
        encryptedValue,
        key,
        ENCRYPTION_POLICY.LEGACY_FORMAT_VERSION,
        Buffer.from("password-manager:v2", "utf8")
      ).toString("utf8");
    }

    const legacyIvValue = process.env.ENCRYPTION_IV;
    if (!legacyIvValue) {
      throw new Error("Legacy encrypted data requires ENCRYPTION_IV");
    }
    const legacyIv = Buffer.from(legacyIvValue, "hex");
    if (legacyIv.length !== ENCRYPTION_POLICY.LEGACY_IV_BYTES) {
      throw new Error("Invalid legacy encryption IV");
    }
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_POLICY.LEGACY_AES_ALGORITHM,
      key,
      legacyIv
    );
    return (
      decipher.update(encryptedValue, "hex", "utf8") + decipher.final("utf8")
    );
  } finally {
    key.fill(0);
  }
}
