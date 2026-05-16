import { z } from "zod";

const trimmed = (max: number) =>
  z
    .string()
    .transform((s) => s.replace(/\s+/g, " ").trim())
    .pipe(z.string().min(1).max(max));

export const nameSchema = trimmed(60);
export const titleSchema = trimmed(200);
export const descriptionSchema = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().max(2000));
export const questionBodySchema = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().min(1).max(2000));

export const createBoardSchema = z.object({
  title: titleSchema,
  description: descriptionSchema.optional().or(z.literal("")),
});

export const updateBoardSchema = z.object({
  title: titleSchema.optional(),
  description: descriptionSchema.optional().or(z.literal("")),
  closed: z.boolean().optional(),
});

export const createQuestionSchema = z.object({
  authorName: nameSchema,
  body: questionBodySchema,
});

export const toggleAgreementSchema = z.object({
  name: nameSchema,
});
