import { z } from 'zod';

/**
 * Schema for creating a new business model
 * Only the franchiseId, name, and description are required in the body
 * The photo will be handled as a file upload
 */
export const createBusinessModelSchema = z.object({
  franchiseId: z
    .string()
    .min(1, 'Franchise ID é obrigatório')
    .cuid('Franchise ID inválido'),

  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'O nome não pode exceder 100 caracteres')
    .trim(),

  description: z
    .string()
    .min(1, 'Descrição é obrigatória')
    .min(10, 'A descrição deve ter pelo menos 10 caracteres')
    .max(2000, 'A descrição não pode exceder 2000 caracteres')
    .trim(),
});

export type CreateBusinessModelDto = z.infer<typeof createBusinessModelSchema>;
