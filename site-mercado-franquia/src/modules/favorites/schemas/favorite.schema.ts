import { z } from 'zod';

export const FavoriteResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  franchiseId: z.string(),
  createdAt: z.date(),
});

export const FavoriteWithFranchiseSchema = FavoriteResponseSchema.extend({
  franchise: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    logoUrl: z.string().nullable(),
    thumbnailUrl: z.string().nullable(),
    segment: z.string().nullable(),
    subsegment: z.string().nullable(),
    // Investment Range
    minimumInvestment: z.number().nullable(),
    maximumInvestment: z.number().nullable(),
    // Revenue and fees
    averageMonthlyRevenue: z.number().nullable(),
    franchiseFee: z.number().nullable(),
    // ROI Range
    minimumReturnOnInvestment: z.number().nullable(),
    maximumReturnOnInvestment: z.number().nullable(),
    // Ratings and stats
    averageRating: z.number().nullable(),
    reviewCount: z.number(),
    totalUnits: z.number().nullable(),
    isActive: z.boolean(),
  }),
});

export const PaginatedFavoritesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'name']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
});

export const FavoriteIdsResponseSchema = z.object({
  franchiseIds: z.array(z.string()),
});

export const IsFavoritedResponseSchema = z.object({
  isFavorited: z.boolean(),
});

export const ToggleFavoriteResponseSchema = z.object({
  isFavorited: z.boolean(),
  message: z.string(),
});

export type FavoriteResponseType = z.infer<typeof FavoriteResponseSchema>;
export type FavoriteWithFranchiseType = z.infer<
  typeof FavoriteWithFranchiseSchema
>;
export type PaginatedFavoritesQueryType = z.infer<
  typeof PaginatedFavoritesQuerySchema
>;
export type FavoriteIdsResponseType = z.infer<typeof FavoriteIdsResponseSchema>;
export type IsFavoritedResponseType = z.infer<typeof IsFavoritedResponseSchema>;
export type ToggleFavoriteResponseType = z.infer<
  typeof ToggleFavoriteResponseSchema
>;
