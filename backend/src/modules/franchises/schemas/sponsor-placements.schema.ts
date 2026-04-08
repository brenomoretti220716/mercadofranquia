import { SponsorPlacement } from '@prisma/client';
import z from 'zod';

export const updateSponsorPlacementsSchema = z.object({
  placements: z.array(z.nativeEnum(SponsorPlacement)),
});

export type UpdateSponsorPlacementsType = z.infer<
  typeof updateSponsorPlacementsSchema
>;
