import crypto from "crypto";
import { VaultValuePurpose } from "../src/constants/encryption-policy";
import {
  createVaultKeyMaterial,
  decryptLegacyValue,
  decryptVaultValue,
  encryptVaultValue,
  unwrapVaultKey,
} from "../src/utils/crypto";

describe("vault encryption", () => {
  const originalKey = process.env.ENCRYPTION_KEY;
  const originalIv = process.env.ENCRYPTION_IV;
  const userId = 42;
  const masterPassword = "LocalTestPassword123!";

  beforeAll(() => {
    process.env.ENCRYPTION_KEY ??= crypto.randomBytes(32).toString("hex");
    process.env.ENCRYPTION_IV ??= crypto.randomBytes(16).toString("hex");
  });

  afterAll(() => {
    process.env.ENCRYPTION_KEY = originalKey;
    process.env.ENCRYPTION_IV = originalIv;
  });

  it("wraps a random per-user key with the master password", async () => {
    const material = await createVaultKeyMaterial(masterPassword);
    const unwrapped = await unwrapVaultKey(
      material.wrappedVaultKey,
      material.vaultKeySalt,
      masterPassword
    );

    expect(unwrapped).toEqual(material.vaultKey);
    await expect(
      unwrapVaultKey(
        material.wrappedVaultKey,
        material.vaultKeySalt,
        "wrong-password"
      )
    ).rejects.toThrow();
    material.vaultKey.fill(0);
    unwrapped.fill(0);
  });

  it("uses a unique nonce and authenticated per-user context", () => {
    const vaultKey = crypto.randomBytes(32);
    const plaintext = "correct horse battery staple";
    const first = encryptVaultValue(
      plaintext,
      vaultKey,
      userId,
      VaultValuePurpose.Password
    );
    const second = encryptVaultValue(
      plaintext,
      vaultKey,
      userId,
      VaultValuePurpose.Password
    );

    expect(first).toMatch(/^v3:[0-9a-f]{24}:[0-9a-f]{32}:[0-9a-f]+$/);
    expect(second).not.toBe(first);
    expect(
      decryptVaultValue(
        first,
        vaultKey,
        userId,
        VaultValuePurpose.Password
      )
    ).toBe(plaintext);
    expect(() =>
      decryptVaultValue(
        first,
        vaultKey,
        userId + 1,
        VaultValuePurpose.Password
      )
    ).toThrow();
    vaultKey.fill(0);
  });

  it("rejects ciphertext that has been modified", () => {
    const vaultKey = crypto.randomBytes(32);
    const encrypted = encryptVaultValue(
      "sensitive value",
      vaultKey,
      userId,
      VaultValuePurpose.Password
    );
    const finalCharacter = encrypted.at(-1) === "0" ? "1" : "0";
    const tampered = `${encrypted.slice(0, -1)}${finalCharacter}`;

    expect(() =>
      decryptVaultValue(
        tampered,
        vaultKey,
        userId,
        VaultValuePurpose.Password
      )
    ).toThrow();
    vaultKey.fill(0);
  });

  it("can still read legacy AES-CBC values for migration", () => {
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");
    const iv = Buffer.from(process.env.ENCRYPTION_IV!, "hex");
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    const plaintext = "legacy password";
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    expect(decryptLegacyValue(encrypted)).toBe(plaintext);
  });
});
