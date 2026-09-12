import crypto from "crypto";

const algorithm = "aes-256-gcm";
const legacyAlgorithm = "aes-256-cbc";
const formatVersion = "v2";
const authenticatedContext = Buffer.from("password-manager:v2", "utf8");
const encryptionKeyEnv = process.env.ENCRYPTION_KEY;
const legacyIvEnv = process.env.ENCRYPTION_IV;

if (!encryptionKeyEnv) {
  throw new Error("Environment variable ENCRYPTION_KEY is not set.");
}

const encryptionKey = Buffer.from(encryptionKeyEnv, "hex");
const legacyIv = legacyIvEnv ? Buffer.from(legacyIvEnv, "hex") : undefined;

if (encryptionKey.length !== 32) {
  throw new Error(
    `Invalid ENCRYPTION_KEY length: expected 32 bytes, got ${encryptionKey.length} bytes.`
  );
}

if (legacyIv && legacyIv.length !== 16) {
  throw new Error(
    `Invalid ENCRYPTION_IV length: expected 16 bytes, got ${legacyIv.length} bytes.`
  );
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv);
  cipher.setAAD(authenticatedContext);

  const ciphertext = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    formatVersion,
    iv.toString("hex"),
    authTag.toString("hex"),
    ciphertext.toString("hex"),
  ].join(":");
}

export function decrypt(encryptedText: string): string {
  if (encryptedText.startsWith(`${formatVersion}:`)) {
    const parts = encryptedText.split(":");
    if (parts.length !== 4) {
      throw new Error("Invalid encrypted value format");
    }

    const [, ivHex, authTagHex, ciphertextHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const ciphertext = Buffer.from(ciphertextHex, "hex");

    if (iv.length !== 12 || authTag.length !== 16) {
      throw new Error("Invalid encrypted value format");
    }

    const decipher = crypto.createDecipheriv(algorithm, encryptionKey, iv);
    decipher.setAAD(authenticatedContext);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
  }

  if (!legacyIv) {
    throw new Error("Legacy encrypted value cannot be decrypted");
  }

  const decipher = crypto.createDecipheriv(
    legacyAlgorithm,
    encryptionKey,
    legacyIv
  );
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
