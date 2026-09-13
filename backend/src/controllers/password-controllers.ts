import { Request, Response, NextFunction } from "express";
import fs from "fs";
import logger from "../utils/logger";
import { decryptVaultValue, encryptVaultValue } from "../utils/crypto";
import * as passwordModel from "../models/password-model";
import * as userModel from "../models/user-model";
import {
  setSensitiveResponseHeaders,
  successResponse,
} from "../utils/response";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../middleware/error-middleware";
import {
  EXPORT_FILE_NAME,
  SECURITY_POLICY,
} from "../constants/security-policy";
import {
  removeStoredImage,
  resolveStoredImagePath,
  storeUploadedImage,
} from "../utils/file-storage";
import { parseRouteId } from "../utils/request";
import { StatusCodes } from "../utils/status-codes";
import { VaultValuePurpose } from "../constants/encryption-policy";

async function removeImageSafely(imagePath: string): Promise<void> {
  try {
    await removeStoredImage(imagePath);
  } catch (error) {
    logger.error(`Unable to remove image: ${error}`);
  }
}

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
    logger.debug(`Fetched ${passwords.data.length} password records`);
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
  let imagePath: string | undefined;
  let passwordRecordCreated = false;

  logger.debug(
    `createPassword: name=${name}, hasImage=${Boolean(file)}, questionCount=${questions?.length ?? 0}`
  );

  try {
    const totalPasswords = await passwordModel.getPasswordCount(req.user?.id!);
    if (totalPasswords >= SECURITY_POLICY.MAX_PASSWORDS_PER_USER) {
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
    imagePath = file ? await storeUploadedImage(file) : undefined;
    const encryptedPassword = encryptVaultValue(
      password,
      req.user!.vaultKey,
      user_id,
      VaultValuePurpose.Password
    );
    const newPassword = await passwordModel.addPassword(
      name,
      encryptedPassword,
      imagePath,
      user_id
    );
    passwordRecordCreated = true;
    logger.info(
      `Password created successfully: ${JSON.stringify(newPassword)}`
    );
    if (hasQuestions) {
      const encryptedQuestions = questions.map(
        (q: { question: string; answer: string }) => ({
          question: q.question,
          answer: encryptVaultValue(
            q.answer,
            req.user!.vaultKey,
            user_id,
            VaultValuePurpose.SecurityAnswer
          ),
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
    if (imagePath && !passwordRecordCreated) {
      await removeImageSafely(imagePath);
    }
    next(error);
  }
};

export const getSecurityQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const passwordId = parseRouteId(req.params.id);
    logger.debug(`getSecurityQuestions: passwordId=${passwordId}`);
    const userId = req.user?.id!;
    const questions = await passwordModel.getSecurityQuestions(
      passwordId,
      userId,
      req.user!.vaultKey
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

export const getPasswordImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const passwordId = parseRouteId(req.params.id);
    const passwordRecord = await passwordModel.getPasswordById(
      passwordId,
      req.user?.id!
    );

    if (!passwordRecord?.image) {
      throw new NotFoundError("Image not found");
    }

    const imagePath = resolveStoredImagePath(passwordRecord.image);
    if (!fs.existsSync(imagePath)) {
      throw new NotFoundError("Image not found");
    }

    setSensitiveResponseHeaders(res);
    res.sendFile(imagePath);
  } catch (error) {
    next(error);
  }
};

export const editPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const passwordId = parseRouteId(req.params.id);

  const { name, password, questions } = req.body;
  const file = req.file;
  let imagePath: string | undefined;
  let passwordRecordUpdated = false;

  logger.debug(
    `editPassword: id=${passwordId}, name=${name}, hasImage=${Boolean(file)}, questionCount=${questions?.length ?? 0}`
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

    imagePath = file ? await storeUploadedImage(file) : undefined;
    const encryptedPassword = encryptVaultValue(
      password,
      req.user!.vaultKey,
      userId,
      VaultValuePurpose.Password
    );

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
    passwordRecordUpdated = true;

    if (imagePath && existingPassword.image) {
      await removeImageSafely(existingPassword.image);
    }

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
          answer: encryptVaultValue(
            q.answer,
            req.user!.vaultKey,
            userId,
            VaultValuePurpose.SecurityAnswer
          ),
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
    if (imagePath && !passwordRecordUpdated) {
      await removeImageSafely(imagePath);
    }
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
        await removeImageSafely(password.image);
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
    const { id } = request.body;
    const userId = request.user?.id!;
    const passwordRecord = await passwordModel.getPasswordById(id, userId);

    if (!passwordRecord) {
      throw new NotFoundError("Password not found");
    }

    const decrypted = decryptVaultValue(
      passwordRecord.password,
      request.user!.vaultKey,
      userId,
      VaultValuePurpose.Password
    );
    logger.debug(`Password decrypted for record ID: ${id}`);

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
    const { currentPassword } = req.body;

    const user = await userModel.fetchUserById(userId);
    await userModel.comparePassword(currentPassword, user.password);

    logger.debug(`Exporting passwords for user ID: ${userId}`);

    const passwords = await passwordModel.getPasswords(
      userId,
      SECURITY_POLICY.FIRST_PAGE,
      SECURITY_POLICY.MAX_PASSWORDS_PER_USER,
      undefined
    );

    logger.debug(`Found ${passwords.data.length} passwords to export`);

    const passwordsWithQuestions = await Promise.all(
      passwords.data.map(async (password) => {
        logger.debug(`Processing password ID: ${password.id}`);

        const passwordRecord = await passwordModel.getPasswordById(
          password.id,
          userId
        );

        if (!passwordRecord) {
          throw new NotFoundError("Password not found");
        }

        const questions =
          (await passwordModel.getSecurityQuestions(
            password.id,
            userId,
            req.user!.vaultKey
          )) || [];

        logger.debug(
          `Found ${questions.length} security questions for password ID: ${password.id}`
        );

        const decryptedQuestions = Array.isArray(questions)
          ? questions.map((question) => ({
              question: question.question,
              answer: question.answer,
            }))
          : [];

        return {
          id: password.id,
          name: password.name,
          password: decryptVaultValue(
            passwordRecord.password,
            req.user!.vaultKey,
            userId,
            VaultValuePurpose.Password
          ),
          securityQuestions: decryptedQuestions,
          createdAt: password.createdAt,
          updatedAt: password.updatedAt,
        };
      })
    );

    logger.debug("Finished processing passwords for export");

    setSensitiveResponseHeaders(res);
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${EXPORT_FILE_NAME}"`
    );

    res.status(StatusCodes.OK).json(passwordsWithQuestions);
  } catch (error) {
    logger.error("Error exporting passwords to JSON:", error);
    next(error);
  }
};
