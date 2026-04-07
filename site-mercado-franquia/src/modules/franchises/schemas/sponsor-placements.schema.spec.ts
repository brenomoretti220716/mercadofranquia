import { SponsorPlacement } from '@prisma/client';
import { updateSponsorPlacementsSchema } from './sponsor-placements.schema';

describe('updateSponsorPlacementsSchema', () => {
  it('accepts valid sponsor placements', () => {
    const parsed = updateSponsorPlacementsSchema.safeParse({
      placements: [
        SponsorPlacement.HOME_DESTAQUES,
        SponsorPlacement.QUIZ,
      ],
    });

    expect(parsed.success).toBe(true);
  });

  it('rejects invalid sponsor placements', () => {
    const parsed = updateSponsorPlacementsSchema.safeParse({
      placements: ['INVALID_PLACEMENT'],
    });

    expect(parsed.success).toBe(false);
  });
});
