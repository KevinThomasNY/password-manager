import { z } from "zod";

const questionAnswerSchema = z.object({
  question: z.string().max(256, "Question must be at most 256 characters"),
  answer: z.string().max(256, "Answer must be at most 256 characters"),
});

export const createPasswordSchema = z
  .object({
    name: z.string().max(100, "Name must be at most 100 characters"),
    password: z
      .string()
      .min(5, "Password must be at least 5 characters")
      .max(256, "Password must be at most 256 characters"),
    image: z.instanceof(File).optional(),
    questions: z
      .array(questionAnswerSchema)
      .max(15, "You can add up to 15 questions only")
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
  length: z.number().int().min(1, "Length must be at least 1"),
  includeUppercase: z.boolean(),
  includeLowercase: z.boolean(),
  includeNumbers: z.boolean(),
  includeSymbols: z.boolean(),
});

export const decryptPasswordSchema = z.object({
  password: z
    .string()
    .min(3, "Password must be at least 3 characters")
    .max(512, "Password must be at most 256 characters"),
});

export type CreatePasswordFormValues = z.infer<typeof createPasswordSchema>;
