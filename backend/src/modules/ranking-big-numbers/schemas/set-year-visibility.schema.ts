import { z } from 'zod';

export const setYearVisibilitySchema = z.object({
  year: z.number().int().min(2000).max(2100),
  isHidden: z.boolean(),
});

export type SetYearVisibilityType = z.infer<typeof setYearVisibilitySchema>;
