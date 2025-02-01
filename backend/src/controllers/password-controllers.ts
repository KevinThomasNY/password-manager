import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import { encrypt, decrypt } from "../utils/crypto";
import * as passwordModel from "../models/password-model";
import { successResponse } from "../utils/response";
import {
  UnauthorizedError,
  ValidationError,
} from "../middleware/error-middleware";

export const getPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.debug(`getPassword: user=${req.user?.id}`);
    const { page = 1, pageSize = 10, search } = req.query;
    const passwords = await passwordModel.getPasswords(
      req.user?.id!,
      Number(page),
      Number(pageSize),
      search?.toString()
    );
    logger.debug(`Passwords, ${JSON.stringify(passwords)}`);
    successResponse({
      res,
      message: "Passwords fetched successfully",
      data: passwords,
    });
  } catch (error) {
    next(error);
  }
};

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
    const totalPasswords = await passwordModel.getPasswordCount(req.user?.id!);
    if (totalPasswords >= 300) {
      throw new ValidationError(
        "You have reached the maximum number of passwords allowed."
      );
    }
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

export const editPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const passwordId = parseInt(req.params.id, 10);

  const { name, password, image, questions } = req.body;

  logger.debug(
    `editPassword: id=${passwordId}, name=${name}, image=${image}, questions=${questions}`
  );

  try {
    const existingPassword = await passwordModel.getPasswordById(
      passwordId,
      req.user?.id!
    );
    if (!existingPassword) {
      throw new ValidationError("Password not found.");
    }
    const userId = existingPassword.userId;
    if (userId !== req.user?.id) {
      throw new UnauthorizedError(
        "You are not authorized to edit this password"
      );
    }
    logger.debug(`Current user ID: ${req.user?.id}`);
    if (name !== existingPassword.name) {
      const passwordExists = await passwordModel.checkExistingPassword(
        name,
        req.user?.id!
      );
      if (passwordExists) {
        throw new ValidationError("Password with this name already exists.");
      }
    }

    const encryptedPassword = encrypt(password);

    const updatedPassword = await passwordModel.updatePassword(passwordId, {
      name,
      password: encryptedPassword,
      image,
    });

    logger.info(
      `Password updated successfully: ${JSON.stringify(updatedPassword)}`
    );

    await passwordModel.deleteSecurityQuestions(passwordId);

    if (questions.length > 0) {
      const questionTexts = questions.map(
        (q: { question: string }) => q.question
      );
      const uniqueQuestions = new Set(questionTexts);

      if (uniqueQuestions.size !== questionTexts.length) {
        throw new ValidationError("Each security question must be unique.");
      }

      const encryptedQuestions = questions.map(
        (q: { question: string; answer: string }) => ({
          question: q.question,
          answer: encrypt(q.answer),
        })
      );

      await passwordModel.addSecurityQuestions(passwordId, encryptedQuestions);
    }

    successResponse({
      res,
      message: "Password updated successfully",
      data: updatedPassword,
    });
  } catch (error) {
    next(error);
  }
};

export const generatePassword = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const {
      length,
      includeUppercase,
      includeLowercase,
      includeNumbers,
      includeSymbols,
    } = request.body;

    logger.debug(
      `generatePassword: length=${length}, includeUppercase=${includeUppercase}, includeLowercase=${includeLowercase}, includeNumbers=${includeNumbers}, includeSymbols=${includeSymbols}`
    );

    const password = passwordModel.generatePasswordModel(
      length,
      includeUppercase,
      includeLowercase,
      includeNumbers,
      includeSymbols
    );

    logger.debug(password);

    successResponse({
      res: response,
      message: "Password generated successfully",
      data: password,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePassword = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const passwordId = parseInt(request.params.id, 10);
    const password = await passwordModel.getPasswordById(
      passwordId,
      request.user?.id!
    );

    if (!password) {
      throw new ValidationError("Password not found.");
    }

    const userId = password.userId;
    if (userId !== request.user?.id) {
      throw new UnauthorizedError(
        "You are not authorized to delete this password"
      );
    }

    const data = await passwordModel.deletePasswordById(passwordId);
    successResponse({
      res: response,
      message: "Password deleted successfully",
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

export const decryptPassword = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const { password } = request.body;
    logger.debug(`decryptPassword: password=${password}`);
    const decrypted = decrypt(password);
    logger.debug(`Decrypted password: ${decrypted}`);

    successResponse({
      res: response,
      message: "Password decrypted successfully",
      data: { decrypted },
    });
    return true;
  } catch (error) {
    next(error);
  }
};
