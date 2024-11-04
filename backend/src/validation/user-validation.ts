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

export const editUserSchema = createUserSchema;

export const login = createUserSchema.omit({
  firstName: true,
  lastName: true,
});
