import { z } from 'zod';

const quarterSchema = z
  .string()
  .regex(/^Q[1-4]$/, 'Trimestre inválido (use Q1, Q2, Q3 ou Q4)');

export const createAbfSegmentSchema = z.object({
  year: z.coerce
    .number()
    .int()
    .min(1900, 'Ano inválido')
    .max(2100, 'Ano inválido'),
  quarter: quarterSchema,
  segment: z.string().min(1).max(200),
  acronym: z.string().min(1).max(10),
  value: z.coerce.number().int().nonnegative(),
});

export type CreateAbfSegmentType = z.infer<typeof createAbfSegmentSchema>;
