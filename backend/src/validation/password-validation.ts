import { z } from "zod";
import { SECURITY_POLICY } from "../constants/security-policy";

const questionAnswerSchema = z.object({
  question: z
    .string()
    .trim()
    .nonempty("Question is required")
    .max(
      SECURITY_POLICY.SECURITY_QUESTION_MAX_LENGTH,
      `Question must be at most ${SECURITY_POLICY.SECURITY_QUESTION_MAX_LENGTH} characters`
    ),
  answer: z
    .string()
    .trim()
    .nonempty("Answer is required")
    .max(
      SECURITY_POLICY.SECURITY_QUESTION_MAX_LENGTH,
      `Answer must be at most ${SECURITY_POLICY.SECURITY_QUESTION_MAX_LENGTH} characters`
    ),
});

export const createPasswordSchema = z
  .object({
    name: z
      .string()
      .nonempty("Name is required")
      .max(
        SECURITY_POLICY.VAULT_ENTRY_NAME_MAX_LENGTH,
        `Name must be at most ${SECURITY_POLICY.VAULT_ENTRY_NAME_MAX_LENGTH} characters`
      ),
    password: z
      .string()
      .nonempty("Password is required")
      .min(
        SECURITY_POLICY.SAVED_PASSWORD_MIN_LENGTH,
        `Password must be at least ${SECURITY_POLICY.SAVED_PASSWORD_MIN_LENGTH} characters`
      )
      .max(
        SECURITY_POLICY.SAVED_PASSWORD_MAX_LENGTH,
        `Password must be at most ${SECURITY_POLICY.SAVED_PASSWORD_MAX_LENGTH} characters`
      ),
    image: z.instanceof(File).optional(),
    questions: z
      .array(questionAnswerSchema)
      .max(
        SECURITY_POLICY.MAX_SECURITY_QUESTIONS,
        `You can add up to ${SECURITY_POLICY.MAX_SECURITY_QUESTIONS} questions only`
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.questions) {
      data.questions.forEach((q, index) => {
        // If a question is filled but the answer is empty:
        if (q.question && !q.answer.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Answer is required if question is filled",
            path: ["questions", index, "answer"],
          });
        }
        // If an answer is filled but the question is empty:
        if (!q.question.trim() && q.answer) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Question is required if answer is filled",
            path: ["questions", index, "question"],
          });
        }
      });
    }
  });

export const generatePasswordSchema = z.object({
  length: z
    .number()
    .int()
    .min(
      SECURITY_POLICY.GENERATED_PASSWORD_MIN_LENGTH,
      `Length must be at least ${SECURITY_POLICY.GENERATED_PASSWORD_MIN_LENGTH}`
    )
    .max(
      SECURITY_POLICY.GENERATED_PASSWORD_MAX_LENGTH,
      `Length must be at most ${SECURITY_POLICY.GENERATED_PASSWORD_MAX_LENGTH}`
    ),
  includeUppercase: z.boolean(),
  includeLowercase: z.boolean(),
  includeNumbers: z.boolean(),
  includeSymbols: z.boolean(),
}).refine(
  (options) =>
    options.includeUppercase ||
    options.includeLowercase ||
    options.includeNumbers ||
    options.includeSymbols,
  { message: "Select at least one character type" }
);

export const decryptPasswordSchema = z.object({
  id: z
    .number()
    .int()
    .min(
      SECURITY_POLICY.MIN_RESOURCE_ID,
      "Password ID must be a positive integer"
    ),
});

export const exportPasswordsSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
});

export type CreatePasswordFormValues = z.infer<typeof createPasswordSchema>;
