import { db } from "../db/db-connection";
import { passwords, securityQuestions } from "../db/schema";
import { AppError } from "../middleware/error-middleware";
import { StatusCodes } from "../utils/status-codes";
import logger from "../utils/logger";
import { eq, and, sql, count, like } from "drizzle-orm";
import { currentTimeStamp } from "../utils/helpers";
import { decrypt } from "../utils/crypto";

export async function getPasswords(
  user_id: number,
  page: number,
  pageSize: number,
  search?: string
) {
  try {
    const whereConditions = [eq(passwords.userId, user_id)];

    if (search) {
      whereConditions.push(like(passwords.name, `%${search}%`));
    }

    const query = db
      .select({
        id: passwords.id,
        name: passwords.name,
        password: passwords.password,
        image: passwords.image,
        createdAt: passwords.createdAt,
        updatedAt: passwords.updatedAt,
      })
      .from(passwords)
      .where(and(...whereConditions))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const countQuery = db
      .select({ count: count() })
      .from(passwords)
      .where(and(...whereConditions));

    const [data, total] = await Promise.all([query, countQuery]);

    return {
      data,
      total: total[0].count,
    };
  } catch (error) {
    logger.error(`Error getting passwords: ${error}`);
    throw new AppError(
      "Error getting passwords",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

export async function getPasswordCount(user_id: number) {
  logger.debug(`Getting password count for user ID: ${user_id}`);
  try {
    const totalPasswords = await db
      .select({ count: count() })
      .from(passwords)
      .where(eq(passwords.userId, user_id));

    logger.debug(`Count: ${totalPasswords[0].count}`);
    return totalPasswords[0].count;
  } catch (error) {
    logger.error(`Error getting password count: ${error}`);
    throw new AppError(
      "Error getting password count",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

export async function checkExistingPassword(name: string, user_id: number) {
  logger.debug(`Checking if password exists: name=${name}`);
  try {
    const password = await db
      .select({ id: passwords.id })
      .from(passwords)
      .where(
        and(
          eq(sql`LOWER(${passwords.name})`, name.toLowerCase()),
          eq(passwords.userId, user_id)
        )
      );

    logger.debug(`Password: ${JSON.stringify(password, null, 2)}`);

    return password.length > 0;
  } catch (error) {
    logger.error(`Error checking if password exists: ${error}`);
    throw new AppError(
      "Error checking if password exists",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

export async function addPassword(
  name: string,
  password: string,
  image: string | undefined,
  userId: number
) {
  logger.debug(`Adding new password: name=${name}, image=${image}`);
  try {
    const [newPassword] = await db
      .insert(passwords)
      .values({
        name,
        password,
        image,
        userId,
      })
      .returning({
        id: passwords.id,
        name: passwords.name,
        image: passwords.image,
      });

    return newPassword;
  } catch (error) {
    logger.error(`Error adding password: ${error}`);
    throw new AppError(
      "Error adding password",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

export async function addSecurityQuestions(
  passwordId: number,
  questions: Array<{ question: string; answer: string }>
) {
  logger.debug(`Adding security questions for password ID: ${passwordId}`);

  try {
    const questionRecords = questions.map((q) => ({
      passwordId,
      question: q.question,
      answer: q.answer,
    }));

    await db.insert(securityQuestions).values(questionRecords);

    logger.info(`Security questions added for password ID: ${passwordId}`);
  } catch (error) {
    logger.error(`Error adding security questions: ${error}`);
    throw new AppError(
      "Error adding security questions",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}
export async function getPasswordById(passwordId: number, userId: number) {
  logger.debug(`Fetching password by ID: ${passwordId} for user ID: ${userId}`);
  try {
    const password = await db
      .select()
      .from(passwords)
      .where(and(eq(passwords.id, passwordId), eq(passwords.userId, userId)))
      .limit(1);

    if (password.length === 0) {
      return null;
    }

    return password[0];
  } catch (error) {
    logger.error(`Error fetching password by ID: ${error}`);
    throw new AppError(
      "Error fetching password",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

export async function updatePassword(
  passwordId: number,
  updates: {
    name?: string;
    password?: string;
    image?: string;
  }
) {
  logger.debug(
    `Updating password ID: ${passwordId} with updates: ${JSON.stringify(
      updates
    )}`
  );
  try {
    const updatedRows = await db
      .update(passwords)
      .set({
        ...updates,
        updatedAt: currentTimeStamp(),
      })
      .where(eq(passwords.id, passwordId))
      .returning({
        id: passwords.id,
        name: passwords.name,
        image: passwords.image,
        updatedAt: passwords.updatedAt,
      });

    if (updatedRows.length === 0) {
      throw new AppError("Password not found", StatusCodes.NOT_FOUND);
    }

    return updatedRows[0];
  } catch (error) {
    logger.error(`Error updating password: ${error}`);
    throw new AppError(
      "Error updating password",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

export async function deleteSecurityQuestions(passwordId: number) {
  logger.debug(`Deleting security questions for password ID: ${passwordId}`);
  try {
    await db
      .delete(securityQuestions)
      .where(eq(securityQuestions.passwordId, passwordId));
    logger.info(`Security questions deleted for password ID: ${passwordId}`);
  } catch (error) {
    logger.error(`Error deleting security questions: ${error}`);
    throw new AppError(
      "Error deleting security questions",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

export function generatePasswordModel(
  length: number,
  includesUppercase: boolean,
  includesLowercase: boolean,
  includesNumbers: boolean,
  includesSymbols: boolean
) {
  logger.debug(`Generating password with length: ${length}`);

  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
  const numberChars = "0123456789";
  const symbolChars = "!@#$%^&*()_+-=[]{}|;:,.<>/?";

  let characterPool = "";
  let requiredChars: string[] = [];

  if (includesUppercase) {
    characterPool += uppercaseChars;
    requiredChars.push(
      uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)]
    );
  }
  if (includesLowercase) {
    characterPool += lowercaseChars;
    requiredChars.push(
      lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)]
    );
  }
  if (includesNumbers) {
    characterPool += numberChars;
    requiredChars.push(
      numberChars[Math.floor(Math.random() * numberChars.length)]
    );
  }
  if (includesSymbols) {
    characterPool += symbolChars;
    requiredChars.push(
      symbolChars[Math.floor(Math.random() * symbolChars.length)]
    );
  }

  if (characterPool.length === 0) {
    throw new Error("At least one character type must be selected.");
  }

  if (length < requiredChars.length) {
    throw new Error(`Length must be at least ${requiredChars.length}`);
  }

  let passwordChars: string[] = [...requiredChars];

  for (let i = requiredChars.length; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characterPool.length);
    passwordChars.push(characterPool[randomIndex]);
  }

  passwordChars = passwordChars.sort(() => Math.random() - 0.5);

  return passwordChars.join("");
}

export async function deletePasswordById(passwordId: number) {
  logger.debug(`Deleting password ID: ${passwordId}`);
  try {
    await db.delete(passwords).where(eq(passwords.id, passwordId));
  } catch (error) {
    logger.error(`Error deleting password: ${error}`);
    throw new AppError(
      "Error deleting password",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

export async function getSecurityQuestions(passwordId: number, userId: number) {
  logger.debug(
    `Fetching security questions for password ID: ${passwordId} by user ID: ${userId}`
  );
  try {
    const passwordRecord = await db
      .select({ userId: passwords.userId })
      .from(passwords)
      .where(and(eq(passwords.id, passwordId), eq(passwords.userId, userId)))
      .limit(1);
    logger.debug(`Password Record exists: ${JSON.stringify(passwordRecord)}`);
    if (passwordRecord.length === 0) {
      throw new AppError("Password not found", StatusCodes.NOT_FOUND);
    }
    const questions = await db
      .select({
        question: securityQuestions.question,
        answer: securityQuestions.answer,
      })
      .from(securityQuestions)
      .where(eq(securityQuestions.passwordId, passwordId));
    logger.debug(`Security Questions: ${JSON.stringify(questions)}`);

    const decryptedQuestion = questions.map((q) => ({
      question: q.question,
      answer: decrypt(q.answer),
    }));
    return decryptedQuestion;
  } catch (error) {
    logger.error(`Error fetching security questions: ${error}`);
    throw new AppError(
      "Error fetching security questions",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}
