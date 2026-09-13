import { eq } from "drizzle-orm";
import {
  VaultEncryptionVersion,
  VaultValuePurpose,
} from "../constants/encryption-policy";
import { db } from "../db/db-connection";
import { passwords, securityQuestions, users } from "../db/schema";
import {
  createVaultKeyMaterial,
  decryptLegacyValue,
  encryptVaultValue,
  unwrapVaultKey,
} from "../utils/crypto";

interface VaultUser {
  id: number;
  wrappedVaultKey: string | null;
  vaultKeySalt: string | null;
  vaultEncryptionVersion: VaultEncryptionVersion;
}

export async function unlockUserVault(
  user: VaultUser,
  masterPassword: string
): Promise<Buffer> {
  if (user.vaultEncryptionVersion === VaultEncryptionVersion.EnvelopeV1) {
    if (!user.wrappedVaultKey || !user.vaultKeySalt) {
      throw new Error("User vault key metadata is incomplete");
    }
    return unwrapVaultKey(
      user.wrappedVaultKey,
      user.vaultKeySalt,
      masterPassword
    );
  }

  if (user.vaultEncryptionVersion !== VaultEncryptionVersion.Legacy) {
    throw new Error("Unsupported vault encryption version");
  }

  return migrateLegacyVault(user.id, masterPassword);
}

async function migrateLegacyVault(
  userId: number,
  masterPassword: string
): Promise<Buffer> {
  const material = await createVaultKeyMaterial(masterPassword);
  let currentEnvelope:
    | { wrappedVaultKey: string; vaultKeySalt: string }
    | undefined;
  try {
    db.transaction((transaction) => {
      const [currentUser] = transaction
        .select({
          wrappedVaultKey: users.wrappedVaultKey,
          vaultKeySalt: users.vaultKeySalt,
          vaultEncryptionVersion: users.vaultEncryptionVersion,
        })
        .from(users)
        .where(eq(users.id, userId))
        .all();
      if (
        currentUser?.vaultEncryptionVersion ===
          VaultEncryptionVersion.EnvelopeV1 &&
        currentUser.wrappedVaultKey &&
        currentUser.vaultKeySalt
      ) {
        currentEnvelope = {
          wrappedVaultKey: currentUser.wrappedVaultKey,
          vaultKeySalt: currentUser.vaultKeySalt,
        };
        return;
      }

      const passwordRecords = transaction
        .select({ id: passwords.id, value: passwords.password })
        .from(passwords)
        .where(eq(passwords.userId, userId))
        .all();

      for (const record of passwordRecords) {
        transaction
          .update(passwords)
          .set({
            password: encryptVaultValue(
              decryptLegacyValue(record.value),
              material.vaultKey,
              userId,
              VaultValuePurpose.Password
            ),
          })
          .where(eq(passwords.id, record.id))
          .run();
      }

      const questionRecords = transaction
        .select({ id: securityQuestions.id, value: securityQuestions.answer })
        .from(securityQuestions)
        .innerJoin(passwords, eq(securityQuestions.passwordId, passwords.id))
        .where(eq(passwords.userId, userId))
        .all();

      for (const record of questionRecords) {
        transaction
          .update(securityQuestions)
          .set({
            answer: encryptVaultValue(
              decryptLegacyValue(record.value),
              material.vaultKey,
              userId,
              VaultValuePurpose.SecurityAnswer
            ),
          })
          .where(eq(securityQuestions.id, record.id))
          .run();
      }

      transaction
        .update(users)
        .set({
          wrappedVaultKey: material.wrappedVaultKey,
          vaultKeySalt: material.vaultKeySalt,
          vaultEncryptionVersion: VaultEncryptionVersion.EnvelopeV1,
        })
        .where(eq(users.id, userId))
        .run();
    });
    if (currentEnvelope) {
      return unwrapVaultKey(
        currentEnvelope.wrappedVaultKey,
        currentEnvelope.vaultKeySalt,
        masterPassword
      );
    }
    return Buffer.from(material.vaultKey);
  } finally {
    material.vaultKey.fill(0);
  }
}
