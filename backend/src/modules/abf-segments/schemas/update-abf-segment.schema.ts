import { z } from 'zod';

const quarterSchema = z
  .string()
  .regex(/^Q[1-4]$/, 'Trimestre inválido (use Q1, Q2, Q3 ou Q4)');

export const updateAbfSegmentSchema = z
  .object({
    year: z.coerce
      .number()
      .int()
      .min(1900, 'Ano inválido')
      .max(2100, 'Ano inválido')
      .optional(),
    quarter: quarterSchema.optional(),
    segment: z.string().min(1).max(200).optional(),
    acronym: z.string().min(1).max(10).optional(),
    value: z.coerce.number().int().nonnegative().optional(),
  })
  .strict();

export type UpdateAbfSegmentType = z.infer<typeof updateAbfSegmentSchema>;
