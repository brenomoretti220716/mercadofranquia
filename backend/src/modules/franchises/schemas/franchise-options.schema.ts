import { z } from 'zod';

export const franchiseOptionsSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type FranchiseOptionsType = z.infer<typeof franchiseOptionsSchema>;
