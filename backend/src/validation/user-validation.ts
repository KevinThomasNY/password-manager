import { z } from "zod";

export const createUserSchema = z.object({
  userName: z
    .string()
    .min(1, "Username is required")
    .max(50, "Username cannot exceed 50 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(256, "Password cannot exceed 256 characters"),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name cannot exceed 50 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name cannot exceed 50 characters"),
});

export const editUserProfileSchema = z
  .object({
    userName: z
      .string()
      .min(1, "Username is required")
      .max(50, "Username cannot exceed 50 characters"),
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(50, "First name cannot exceed 50 characters"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(50, "Last name cannot exceed 50 characters"),
  })
  .strict();

export const editUserPasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Current password is required")
      .max(256, "Password cannot exceed 256 characters"),
    newPassword: z
      .string()
      .min(1, "New password is required")
      .max(256, "Password cannot exceed 256 characters"),
    confirmNewPassword: z
      .string()
      .min(1, "Confirm new password is required")
      .max(256, "Password cannot exceed 256 characters"),
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

export const login = createUserSchema.omit({
  firstName: true,
  lastName: true,
});
