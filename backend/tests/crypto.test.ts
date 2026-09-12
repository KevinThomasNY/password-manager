import crypto from "crypto";

describe("password encryption", () => {
  const originalKey = process.env.ENCRYPTION_KEY;
  const originalIv = process.env.ENCRYPTION_IV;

  beforeAll(() => {
    process.env.ENCRYPTION_KEY ??= crypto.randomBytes(32).toString("hex");
    process.env.ENCRYPTION_IV ??= crypto.randomBytes(16).toString("hex");
  });

  afterAll(() => {
    process.env.ENCRYPTION_KEY = originalKey;
    process.env.ENCRYPTION_IV = originalIv;
  });

  it("uses a unique IV and decrypts authenticated ciphertext", () => {
    const { decrypt, encrypt } = require("../src/utils/crypto");
    const plaintext = "correct horse battery staple";
    const first = encrypt(plaintext);
    const second = encrypt(plaintext);

    expect(first).toMatch(/^v2:[0-9a-f]{24}:[0-9a-f]{32}:[0-9a-f]+$/);
    expect(second).not.toBe(first);
    expect(decrypt(first)).toBe(plaintext);
    expect(decrypt(second)).toBe(plaintext);
  });

  it("rejects ciphertext that has been modified", () => {
    const { decrypt, encrypt } = require("../src/utils/crypto");
    const encrypted = encrypt("sensitive value");
    const finalCharacter = encrypted.at(-1) === "0" ? "1" : "0";
    const tampered = `${encrypted.slice(0, -1)}${finalCharacter}`;

    expect(() => decrypt(tampered)).toThrow();
  });

  it("can still read legacy AES-CBC values", () => {
    const { decrypt } = require("../src/utils/crypto");
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");
    const iv = Buffer.from(process.env.ENCRYPTION_IV!, "hex");
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    const plaintext = "legacy password";
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    expect(decrypt(encrypted)).toBe(plaintext);
  });
});
