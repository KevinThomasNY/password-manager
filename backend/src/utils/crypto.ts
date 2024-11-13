import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const encryptionKeyEnv = process.env.ENCRYPTION_KEY
const ivEnv = process.env.ENCRYPTION_IV

if (!encryptionKeyEnv) {
  throw new Error("Environment variable ENCRYPTION_KEY is not set.");
}

if (!ivEnv) {
  throw new Error("Environment variable ENCRYPTION_IV is not set.");
}

const encryptionKey = Buffer.from(encryptionKeyEnv, 'hex');
const iv = Buffer.from(ivEnv, 'hex');

if (encryptionKey.length !== 32) {
  throw new Error(`Invalid ENCRYPTION_KEY length: expected 32 bytes, got ${encryptionKey.length} bytes.`);
}

if (iv.length !== 16) {
  throw new Error(`Invalid ENCRYPTION_IV length: expected 16 bytes, got ${iv.length} bytes.`);
}

export function encrypt(text: string): string {
  const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function decrypt(encryptedText: string): string {
  const decipher = crypto.createDecipheriv(algorithm, encryptionKey, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
