import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import { encrypt } from "../utils/crypto";
import * as passwordModel from "../models/password-model";
import { successResponse } from "../utils/response";
import { ValidationError } from "../middleware/error-middleware";

export const createPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, password, image, questions } = req.body;

  logger.debug(
    `createPassword: name=${name}, image=${image}, questions=${questions}`
  );

  try {
    const hasQuestions = questions && questions.length > 0;
    if (hasQuestions) {
      const questionTexts = questions.map(
        (q: { question: string }) => q.question
      );
      const uniqueQuestions = new Set(questionTexts);

      if (uniqueQuestions.size !== questionTexts.length) {
        throw new ValidationError("Each security question must be unique.");
      }
    }
    const user_id = req.user?.id!;
    const passwordExists = await passwordModel.checkExistingPassword(
      name,
      user_id
    );
    if (passwordExists) {
      throw new ValidationError("Password with this name already exists");
    }
    const encryptedPassword = encrypt(password);
    const newPassword = await passwordModel.addPassword(
      name,
      encryptedPassword,
      image,
      user_id
    );
    logger.info(
      `Password created successfully: ${JSON.stringify(newPassword)}`
    );
    if (hasQuestions) {
      const encryptedQuestions = questions.map(
        (q: { question: string; answer: string }) => ({
          question: q.question,
          answer: encrypt(q.answer),
        })
      );

      await passwordModel.addSecurityQuestions(
        newPassword.id,
        encryptedQuestions
      );
    }
    successResponse({
      res,
      message: "Password created Successfully",
      data: newPassword,
    });
  } catch (error) {
    next(error);
  }
};
