import { z } from "zod";
import { SECURITY_POLICY } from "../constants/security-policy";

const masterPasswordSchema = z
  .string()
  .min(
    SECURITY_POLICY.MASTER_PASSWORD_MIN_LENGTH,
    `Password must be at least ${SECURITY_POLICY.MASTER_PASSWORD_MIN_LENGTH} characters`
  )
  .max(
    SECURITY_POLICY.MASTER_PASSWORD_MAX_LENGTH,
    `Password cannot exceed ${SECURITY_POLICY.MASTER_PASSWORD_MAX_LENGTH} characters`
  );

export const createUserSchema = z.object({
  userName: z
    .string()
    .min(1, "Username is required")
    .max(
      SECURITY_POLICY.USERNAME_MAX_LENGTH,
      `Username cannot exceed ${SECURITY_POLICY.USERNAME_MAX_LENGTH} characters`
    ),
  password: masterPasswordSchema,
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(
      SECURITY_POLICY.PROFILE_NAME_MAX_LENGTH,
      `First name cannot exceed ${SECURITY_POLICY.PROFILE_NAME_MAX_LENGTH} characters`
    ),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(
      SECURITY_POLICY.PROFILE_NAME_MAX_LENGTH,
      `Last name cannot exceed ${SECURITY_POLICY.PROFILE_NAME_MAX_LENGTH} characters`
    ),
});

export const editUserProfileSchema = z
  .object({
    userName: z
      .string()
      .min(1, "Username is required")
      .max(
        SECURITY_POLICY.USERNAME_MAX_LENGTH,
        `Username cannot exceed ${SECURITY_POLICY.USERNAME_MAX_LENGTH} characters`
      ),
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(
        SECURITY_POLICY.PROFILE_NAME_MAX_LENGTH,
        `First name cannot exceed ${SECURITY_POLICY.PROFILE_NAME_MAX_LENGTH} characters`
      ),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(
        SECURITY_POLICY.PROFILE_NAME_MAX_LENGTH,
        `Last name cannot exceed ${SECURITY_POLICY.PROFILE_NAME_MAX_LENGTH} characters`
      ),
  })
  .strict();

export const editUserPasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Current password is required")
      .max(
        SECURITY_POLICY.MASTER_PASSWORD_MAX_LENGTH,
        `Password cannot exceed ${SECURITY_POLICY.MASTER_PASSWORD_MAX_LENGTH} characters`
      ),
    newPassword: masterPasswordSchema,
    confirmNewPassword: masterPasswordSchema,
  })
  .strict()
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New password and confirmation do not match",
    path: ["confirmNewPassword"],
  });

export const editUserSchema = z.union([
  editUserProfileSchema,
  editUserPasswordSchema,
]);

export const login = z.object({
  userName: z
    .string()
    .min(1, "Username is required")
    .max(SECURITY_POLICY.USERNAME_MAX_LENGTH),
  password: z.string().min(1, "Password is required").max(
    SECURITY_POLICY.MASTER_PASSWORD_MAX_LENGTH,
    `Password cannot exceed ${SECURITY_POLICY.MASTER_PASSWORD_MAX_LENGTH} characters`
  ),
});
