import { db } from "../db/db-connection";
import { users, userLoginHistory } from "../db/schema";
import { eq, desc } from "drizzle-orm";
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

export async function updateUserProfile(
  userId: string,
  userName: string,
  firstName: string,
  lastName: string
) {
  logger.debug(
    `Updating user profile: userId=${userId}, userName=${userName}, firstName=${firstName}, lastName=${lastName}`
  );
  try {
    const time = currentTimeStamp();
    const numUserId = parseInt(userId, 10);

    const [user] = await db
      .update(users)
      .set({
        userName,
        firstName,
        lastName,
        updatedAt: time,
      })
      .where(eq(users.id, numUserId))
      .returning({
        userName: users.userName,
        firstName: users.firstName,
        lastName: users.lastName,
      });

    if (!user) {
      throw new ValidationError("User not found");
    }
    return user;
  } catch (error) {
    logger.error(`Error updating user profile: ${error}`);
    throw new AppError(
      "Error updating user profile",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

export async function updateUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  logger.debug(`Updating password for user: userId=${userId}`);
  try {
    const numUserId = parseInt(userId, 10);

    const [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.id, numUserId));

    if (!userRecord) {
      throw new ValidationError("User not found");
    }

    const isMatch = await bcrypt.compare(currentPassword, userRecord.password);
    if (!isMatch) {
      throw new ValidationError("Current password is incorrect");
    }

    const isNewPasswordSame = await bcrypt.compare(
      newPassword,
      userRecord.password
    );
    if (isNewPasswordSame) {
      throw new ValidationError(
        "New password must be different from the current password"
      );
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    const time = currentTimeStamp();

    const [updatedUser] = await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: time,
      })
      .where(eq(users.id, numUserId))
      .returning({ userName: users.userName });

    if (!updatedUser) {
      throw new ValidationError("User not found after update");
    }
    return updatedUser;
  } catch (error) {
    logger.error(`Error updating password: ${error}`);
    throw new AppError(
      "Error updating password",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

export async function fetchUserByEmail(userName: string) {
  logger.debug(`Fetching user by email: userName=${userName}`);
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.userName, userName));
    if (!user) {
      throw new ValidationError("User not found");
    }
    return user;
  } catch (error) {
    logger.error(`Error fetching user: ${error}`);
    throw new AppError(
      "Error fetching user",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
) {
  logger.debug(`Comparing password`);
  try {
    const match = await bcrypt.compare(plainPassword, hashedPassword);
    if (!match) {
      throw new ValidationError("Invalid password");
    }
  } catch (error) {
    logger.error(`Error comparing password: ${error}`);
    throw new AppError(
      "Error comparing password",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

export async function fetchUserById(userId: number) {
  logger.debug(`Fetching user by id: userId=${userId}`);
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      throw new ValidationError("User not found");
    }
    return user;
  } catch (error) {
    logger.error(`Error fetching user: ${error}`);
    throw new AppError(
      "Error fetching user",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

export async function insertLoginHistory(userId: number, ipAddress: string) {
  try {
    logger.debug(
      `Inserting login history: userId=${userId}, ipAddress=${ipAddress}`
    );
    await db.insert(userLoginHistory).values({ userId, ipAddress });
  } catch (error) {
    logger.error(`Error inserting login history: ${error}`);
    throw new AppError(
      "Error inserting login history",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

export async function fetchLoginHistory(userId: number, limit: number) {
  try {
    logger.debug(`Fetching login history: userId=${userId}, limit=${limit}`);
    const userHistory = await db
      .select({
        loginTime: userLoginHistory.loginTime,
      })
      .from(userLoginHistory)
      .where(eq(userLoginHistory.userId, userId))
      .orderBy(desc(userLoginHistory.loginTime))
      .limit(limit);
    logger.debug(`Login history fetched: ${JSON.stringify(userHistory)}`);
    return userHistory;
  } catch (error) {
    logger.error(`Error fetching login history: ${error}`);
    throw new AppError(
      "Error fetching login history",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}
