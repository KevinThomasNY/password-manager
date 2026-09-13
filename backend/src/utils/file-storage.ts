import crypto from "crypto";
import fs from "fs";
import path from "path";
import multer from "multer";
import {
  AllowedImageMimeType,
  IMAGE_EXTENSION_BY_MIME_TYPE,
  SECURITY_POLICY,
} from "../constants/security-policy";
import { ValidationError } from "../middleware/error-middleware";

enum FileSystemErrorCode {
  NotFound = "ENOENT",
}

const FILE_SIGNATURE_LENGTH = 12;
const WEBP_FORMAT_OFFSET = 8;
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const GIF_87A_SIGNATURE = Buffer.from("GIF87a", "ascii");
const GIF_89A_SIGNATURE = Buffer.from("GIF89a", "ascii");
const RIFF_SIGNATURE = Buffer.from("RIFF", "ascii");
const WEBP_SIGNATURE = Buffer.from("WEBP", "ascii");
const uploadDirectory = path.join(__dirname, "..", "uploads");
const allowedImageMimeTypes = new Set<string>(
  Object.values(AllowedImageMimeType)
);

fs.mkdirSync(uploadDirectory, { recursive: true });

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: SECURITY_POLICY.MAX_IMAGE_SIZE_BYTES },
  fileFilter: (_req, file, callback) => {
    if (!allowedImageMimeTypes.has(file.mimetype)) {
      callback(
        new ValidationError(
          "Unsupported image type. Use GIF, JPEG, PNG, or WebP."
        )
      );
      return;
    }

    callback(null, true);
  },
});

export async function storeUploadedImage(
  file: Express.Multer.File
): Promise<string> {
  const detectedMimeType = detectImageMimeType(file.buffer);
  if (!detectedMimeType || detectedMimeType !== file.mimetype) {
    throw new ValidationError("Uploaded file content is not a valid image");
  }

  const extension = IMAGE_EXTENSION_BY_MIME_TYPE[detectedMimeType];
  const fileName = `${crypto.randomUUID()}${extension}`;
  await fs.promises.writeFile(resolveStoredImagePath(fileName), file.buffer, {
    flag: "wx",
  });
  return fileName;
}

export async function removeStoredImage(
  storedImagePath: string
): Promise<void> {
  try {
    await fs.promises.unlink(resolveStoredImagePath(storedImagePath));
  } catch (error) {
    const fileSystemError = error as NodeJS.ErrnoException;
    if (fileSystemError.code !== FileSystemErrorCode.NotFound) {
      throw error;
    }
  }
}

export function resolveStoredImagePath(storedImagePath: string): string {
  return path.join(uploadDirectory, path.basename(storedImagePath));
}

function detectImageMimeType(
  content: Buffer
): AllowedImageMimeType | undefined {
  const signature = content.subarray(0, FILE_SIGNATURE_LENGTH);

  if (signature.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    return AllowedImageMimeType.PNG;
  }
  if (signature.subarray(0, JPEG_SIGNATURE.length).equals(JPEG_SIGNATURE)) {
    return AllowedImageMimeType.JPEG;
  }
  if (
    signature.subarray(0, GIF_87A_SIGNATURE.length).equals(GIF_87A_SIGNATURE) ||
    signature.subarray(0, GIF_89A_SIGNATURE.length).equals(GIF_89A_SIGNATURE)
  ) {
    return AllowedImageMimeType.GIF;
  }
  if (
    signature.subarray(0, RIFF_SIGNATURE.length).equals(RIFF_SIGNATURE) &&
    signature
      .subarray(
        WEBP_FORMAT_OFFSET,
        WEBP_FORMAT_OFFSET + WEBP_SIGNATURE.length
      )
      .equals(WEBP_SIGNATURE)
  ) {
    return AllowedImageMimeType.WEBP;
  }

  return undefined;
}
