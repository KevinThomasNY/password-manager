import { db } from "../db/db-connection";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { AppError, ValidationError } from "../middleware/error-middleware";
import { StatusCodes } from "../utils/status-codes";
import logger from "../utils/logger";
import { currentTimeStamp } from "../utils/helpers";

export async function addNewUser(
  userName: string,
  password: string,
  firstName: string,
  lastName: string
) {
  logger.debug(
    `Adding new user: userName=${userName}, firstName=${firstName}, lastName=${lastName}`
  );
  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.userName, userName));

    if (existingUser.length > 0) {
      throw new ValidationError("Username already exists");
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const [user] = await db
      .insert(users)
      .values({
        userName,
        password: hashedPassword,
        firstName,
        lastName,
      })
      .returning({
        userName: users.userName,
      });

    return user;
  } catch (error) {
    logger.error(`Error adding user: ${error}`);
    throw new AppError("Error adding user", StatusCodes.INTERNAL_SERVER_ERROR);
  }
}

export async function updateUser(
  userId: string,
  userName: string,
  password: string,
  firstName: string,
  lastName: string
) {
  logger.debug(
    `Updating user: userId=${userId}, userName=${userName}, firstName=${firstName}, lastName=${lastName}`
  );
  try {
    const time = currentTimeStamp();
    const numUserId = parseInt(userId);
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const [user] = await db
      .update(users)
      .set({
        userName,
        password: hashedPassword,
        firstName,
        lastName,
        updatedAt: time,
      })
      .where(eq(users.id, numUserId))
      .returning({
        userName: users.userName,
      });
    if (!user) {
      throw new ValidationError("User not found");
    }
    return user;
  } catch (error) {
    logger.error(`Error updating user: ${error}`);
    throw new AppError(
      "Error updating user",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}
