import { z } from 'zod';

/**
 * Schema for business model response
 * Represents the complete business model entity returned to clients
 */
export const businessModelResponseSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  description: z.string(),
  photoUrl: z.string().url(),
  franchiseId: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type BusinessModelResponseDto = z.infer<
  typeof businessModelResponseSchema
>;

/**
 * Schema for business model list response with franchise info
 */
export const businessModelWithFranchiseSchema =
  businessModelResponseSchema.extend({
    franchise: z.object({
      id: z.string().cuid(),
      name: z.string(),
    }),
  });

export type BusinessModelWithFranchiseDto = z.infer<
  typeof businessModelWithFranchiseSchema
>;
