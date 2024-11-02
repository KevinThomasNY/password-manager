import { db } from "../db/db-connection";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { AppError, ValidationError } from "../middleware/error-middleware";
import { StatusCodes } from "../utils/status-codes";
export async function addNewUser(
  userName: string,
  password: string,
  firstName: string,
  lastName: string
) {
  console.log("Adding new user:", userName, firstName, lastName);
  console.log(users);
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
    console.error(`Error adding user: ${error}`);
    throw new AppError("Error adding user", StatusCodes.INTERNAL_SERVER_ERROR);
  }
}
