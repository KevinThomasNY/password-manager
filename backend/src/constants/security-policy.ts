export enum AllowedImageMimeType {
  GIF = "image/gif",
  JPEG = "image/jpeg",
  PNG = "image/png",
  WEBP = "image/webp",
}

export enum PasswordCharacterSet {
  Lowercase = "abcdefghijklmnopqrstuvwxyz",
  Numbers = "0123456789",
  Symbols = "!@#$%^&*()_+-=[]{}|;:,.<>/?",
  Uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
}

const BYTES_PER_MEBIBYTE = 1024 * 1024;

export const SECURITY_POLICY = Object.freeze({
  BCRYPT_SALT_ROUNDS: 12,
  ENCRYPTED_VALUE_MAX_LENGTH: 4096,
  FIRST_PAGE: 1,
  GENERATED_PASSWORD_DEFAULT_LENGTH: 20,
  GENERATED_PASSWORD_MAX_LENGTH: 128,
  GENERATED_PASSWORD_MIN_LENGTH: 12,
  MASTER_PASSWORD_MAX_LENGTH: 256,
  MASTER_PASSWORD_MIN_LENGTH: 12,
  MAX_IMAGE_SIZE_BYTES: 5 * BYTES_PER_MEBIBYTE,
  MAX_PASSWORDS_PER_USER: 300,
  MAX_SECURITY_QUESTIONS: 15,
  MIN_RESOURCE_ID: 1,
  PROFILE_NAME_MAX_LENGTH: 50,
  SAVED_PASSWORD_MAX_LENGTH: 1024,
  SAVED_PASSWORD_MIN_LENGTH: 5,
  SECURITY_QUESTION_MAX_LENGTH: 256,
  STORED_IMAGE_PATH_MAX_LENGTH: 256,
  USERNAME_MAX_LENGTH: 50,
  VAULT_ENTRY_NAME_MAX_LENGTH: 100,
});

export const IMAGE_EXTENSION_BY_MIME_TYPE: Readonly<
  Record<AllowedImageMimeType, string>
> = Object.freeze({
  [AllowedImageMimeType.GIF]: ".gif",
  [AllowedImageMimeType.JPEG]: ".jpg",
  [AllowedImageMimeType.PNG]: ".png",
  [AllowedImageMimeType.WEBP]: ".webp",
});

export const EXPORT_FILE_NAME = "passwords-export.json";
export const IMAGE_UPLOAD_FIELD_NAME = "image";
