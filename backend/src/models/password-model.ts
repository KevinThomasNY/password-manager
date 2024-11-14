import { db } from "../db/db-connection";
import { passwords, securityQuestions } from "../db/schema";
import { AppError } from "../middleware/error-middleware";
import { StatusCodes } from "../utils/status-codes";
import logger from "../utils/logger";
import { eq, and, sql, count } from "drizzle-orm";
import { currentTimeStamp } from "../utils/helpers";

export async function getPasswordCount(user_id: number) {
  logger.debug(`Getting password count for user ID: ${user_id}`);
  try {
    const totalPasswords = await db
      .select({count: count()})
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
  image: string,
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
