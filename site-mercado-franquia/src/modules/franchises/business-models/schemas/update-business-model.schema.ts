import { z } from 'zod';

/**
 * Schema for updating an existing business model
 * All fields are optional (partial update)
 * The photo is optional - if provided, it will replace the existing one
 */
export const updateBusinessModelSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome não pode ser vazio')
    .max(100, 'O nome não pode exceder 100 caracteres')
    .trim()
    .optional(),

  description: z
    .string()
    .min(10, 'A descrição deve ter pelo menos 10 caracteres')
    .max(2000, 'A descrição não pode exceder 2000 caracteres')
    .trim()
    .optional(),
});

export type UpdateBusinessModelDto = z.infer<typeof updateBusinessModelSchema>;
