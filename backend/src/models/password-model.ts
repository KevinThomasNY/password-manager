import { db } from "../db/db-connection";
import { passwords, securityQuestions } from "../db/schema";
import { AppError } from "../middleware/error-middleware";
import { StatusCodes } from "../utils/status-codes";
import logger from "../utils/logger";
import { currentTimeStamp } from "../utils/helpers";

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
