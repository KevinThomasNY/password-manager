import { z } from "zod";

const questionAnswerSchema = z.object({
  question: z.string().max(256, "Question must be at most 256 characters"),
  answer: z.string().max(256, "Answer must be at most 256 characters"),
});

const passwordSchema = z
  .object({
    name: z.string().max(100, "Name must be at most 100 characters"),
    password: z.string().max(256, "Password must be at most 256 characters"),
    image: z
      .string()
      .max(256, "Image must be at most 256 characters")
      .optional(),
    questions: z
      .array(questionAnswerSchema)
      .max(15, "You can add up to 15 questions only")
      .optional(),
  })
  .refine(
    (data) => {
      return data.questions
        ? data.questions.every((q) => q.question && q.answer)
        : true;
    },
    {
      message: "Each question must have a corresponding answer",
      path: ["questions"],
    }
  );

export default passwordSchema;
