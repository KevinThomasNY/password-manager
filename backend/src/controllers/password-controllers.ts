import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
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
  const { name, password, questions } = req.body;

  const file = req.file;

  const imagePath = file ? `/uploads/${file.filename}` : undefined;

  logger.debug(
    `createPassword: name=${name}, image=${imagePath}, questions=${JSON.stringify(
      questions
    )}`
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
      imagePath,
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

export const getSecurityQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const passwordId = parseInt(req.params.id, 10);
    logger.debug(`getSecurityQuestions: passwordId=${passwordId}`);
    const userId = req.user?.id!;
    const questions = await passwordModel.getSecurityQuestions(
      passwordId,
      userId
    );

    successResponse({
      res,
      message: "Security questions fetched successfully",
      data: questions,
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

  const { name, password, questions } = req.body;
  const file = req.file;

  const imagePath = file ? `/uploads/${file.filename}` : undefined;

  logger.debug(
    `editPassword: id=${passwordId}, name=${name}, image=${imagePath}, questions=${JSON.stringify(
      questions
    )}`
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
    if (name.toLowerCase() !== existingPassword.name.toLowerCase()) {
      const passwordExists = await passwordModel.checkExistingPassword(
        name,
        req.user?.id!
      );
      if (passwordExists) {
        throw new ValidationError("Password with this name already exists.");
      }
    }

    const encryptedPassword = encrypt(password);

    if (imagePath && existingPassword.image) {
      const oldImagePath = path.join(__dirname, "..", existingPassword.image);
      fs.unlink(oldImagePath, (err) => {
        if (err) {
          logger.error("Error removing old image: ", err);
        } else {
          logger.info("Old image removed successfully");
        }
      });
    }

    const updateData: { name: string; password: string; image?: string } = {
      name,
      password: encryptedPassword,
    };
    if (imagePath) {
      updateData.image = imagePath;
    }

    const updatedPassword = await passwordModel.updatePassword(
      passwordId,
      updateData
    );

    logger.info(
      `Password updated successfully: ${JSON.stringify(updatedPassword)}`
    );

    await passwordModel.deleteSecurityQuestions(passwordId);

    if (questions && questions.length > 0) {
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

export const deletePasswordsBulk = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ValidationError("Request must contain an array of ids.");
    }

    const deletedResults = [];

    for (const passwordId of ids) {
      const password = await passwordModel.getPasswordById(
        passwordId,
        req.user?.id!
      );

      if (!password) {
        throw new ValidationError(`Password with id ${passwordId} not found.`);
      }

      if (password.userId !== req.user?.id) {
        throw new UnauthorizedError(
          `You are not authorized to delete password with id ${passwordId}.`
        );
      }

      if (password.image) {
        const relativePath = password.image.startsWith("/")
          ? password.image.slice(1)
          : password.image;
        const absolutePath = path.join(__dirname, "..", relativePath);

        try {
          fs.unlinkSync(absolutePath);
          logger.debug(`Image file for password id ${passwordId} deleted successfully.`);
        } catch (err) {
          logger.error(`Error deleting image file for password id ${passwordId}:`, err);
        }
      }

      const data = await passwordModel.deletePasswordById(passwordId);
      deletedResults.push(data);
    }

    successResponse({
      res,
      message: "Passwords deleted successfully",
      data: deletedResults,
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

export const exportPasswordsJson = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id!;
    
    logger.debug(`Exporting passwords for user ID: ${userId}`);
    
    const passwords = await passwordModel.getPasswords(
      userId,
      1,
      10000,
      undefined
    );
    
    logger.debug(`Found ${passwords.data.length} passwords to export`);
    
    const passwordsWithQuestions = await Promise.all(
      passwords.data.map(async (password) => {
        logger.debug(`Processing password ID: ${password.id}`);
        
        const questions = await passwordModel.getSecurityQuestions(
          password.id,
          userId
        ) || [];
        
        logger.debug(`Found ${questions.length} security questions for password ID: ${password.id}`);
        
        const decryptedQuestions = Array.isArray(questions) ? 
          questions.map(q => ({
            question: q.question,
            answer: q.answer ? decrypt(q.answer) : ''
          })) : [];
        
        return {
          id: password.id,
          name: password.name,
          password: password.password ? decrypt(password.password) : '',
          securityQuestions: decryptedQuestions,
          createdAt: password.createdAt,
          updatedAt: password.updatedAt
        };
      })
    );
    
    logger.debug('Finished processing passwords for export');
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="passwords-export.json"');
    
    res.status(200).json(passwordsWithQuestions);
    
  } catch (error) {
    logger.error('Error exporting passwords to JSON:', error);
    next(error);
  }
};