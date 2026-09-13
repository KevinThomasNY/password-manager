import crypto from "crypto";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import {
  VaultEncryptionVersion,
  VaultValuePurpose,
} from "../src/constants/encryption-policy";
import { SECURITY_POLICY } from "../src/constants/security-policy";
import { db } from "../src/db/db-connection";
import { passwords, users } from "../src/db/schema";
import { unlockUserVault } from "../src/services/vault-service";
import { decryptVaultValue } from "../src/utils/crypto";

function encryptLegacyValue(plaintext: string): string {
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(Buffer.from("password-manager:v2", "utf8"));
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  return [
    "v2",
    nonce.toString("hex"),
    cipher.getAuthTag().toString("hex"),
    ciphertext.toString("hex"),
  ].join(":");
}

describe("legacy vault migration", () => {
  it("atomically moves a shared-key vault to a per-user key", async () => {
    const masterPassword = "LegacyTestPassword123!";
    const plaintext = "legacy vault secret";
    const [user] = await db
      .insert(users)
      .values({
        userName: "legacy_migration_user",
        password: await bcrypt.hash(
          masterPassword,
          SECURITY_POLICY.BCRYPT_SALT_ROUNDS
        ),
        firstName: "Legacy",
        lastName: "User",
      })
      .returning();
    const [passwordRecord] = await db
      .insert(passwords)
      .values({
        name: "Legacy record",
        password: encryptLegacyValue(plaintext),
        userId: user.id,
      })
      .returning();

    const vaultKey = await unlockUserVault(user, masterPassword);
    const [migratedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));
    const [migratedPassword] = await db
      .select()
      .from(passwords)
      .where(eq(passwords.id, passwordRecord.id));

    expect(migratedUser.vaultEncryptionVersion).toBe(
      VaultEncryptionVersion.EnvelopeV1
    );
    expect(migratedUser.wrappedVaultKey).toBeTruthy();
    expect(migratedPassword.password).toMatch(/^v3:/);
    expect(
      decryptVaultValue(
        migratedPassword.password,
        vaultKey,
        user.id,
        VaultValuePurpose.Password
      )
    ).toBe(plaintext);
    vaultKey.fill(0);
  });
});
