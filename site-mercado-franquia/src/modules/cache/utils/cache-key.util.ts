import { createHash } from 'crypto';
import { FranchiseFiltersDto } from '../../franchises/dto/franchise-filters.dto';

/**
 * Generate a cache key for franchise list queries
 * Creates a consistent hash from filter parameters
 */
export function generateFranchiseListCacheKey(
  filters: FranchiseFiltersDto,
): string {
  // Normalize filters by removing undefined values and sorting keys
  const normalized: Record<string, unknown> = {};

  // Include all filter properties
  if (filters.page !== undefined) normalized.page = filters.page;
  if (filters.limit !== undefined) normalized.limit = filters.limit;
  if (filters.search) normalized.search = filters.search.toLowerCase().trim();
  if (filters.segment)
    normalized.segment = filters.segment.toLowerCase().trim();
  if (filters.minUnits !== undefined) normalized.minUnits = filters.minUnits;
  if (filters.maxUnits !== undefined) normalized.maxUnits = filters.maxUnits;
  if (filters.minInvestment !== undefined)
    normalized.minInvestment = filters.minInvestment;
  if (filters.maxInvestment !== undefined)
    normalized.maxInvestment = filters.maxInvestment;
  if (filters.minFranchiseFee !== undefined)
    normalized.minFranchiseFee = filters.minFranchiseFee;
  if (filters.maxFranchiseFee !== undefined)
    normalized.maxFranchiseFee = filters.maxFranchiseFee;
  if (filters.minRevenue !== undefined)
    normalized.minRevenue = filters.minRevenue;
  if (filters.maxRevenue !== undefined)
    normalized.maxRevenue = filters.maxRevenue;
  if (filters.minROI !== undefined) normalized.minROI = filters.minROI;
  if (filters.maxROI !== undefined) normalized.maxROI = filters.maxROI;
  if (filters.minArea !== undefined) normalized.minArea = filters.minArea;
  if (filters.maxArea !== undefined) normalized.maxArea = filters.maxArea;
  if (filters.minFoundationYear !== undefined)
    normalized.minFoundationYear = filters.minFoundationYear;
  if (filters.maxFoundationYear !== undefined)
    normalized.maxFoundationYear = filters.maxFoundationYear;
  if (filters.rating !== undefined) normalized.rating = filters.rating;
  if (filters.minRating !== undefined) normalized.minRating = filters.minRating;
  if (filters.maxRating !== undefined) normalized.maxRating = filters.maxRating;
  if (filters.isAbfAssociated !== undefined)
    normalized.isAbfAssociated = filters.isAbfAssociated;

  // Include sort parameters
  if (filters.unitsSort) normalized.unitsSort = filters.unitsSort;
  if (filters.investmentSort)
    normalized.investmentSort = filters.investmentSort;
  if (filters.franchiseFeeSort)
    normalized.franchiseFeeSort = filters.franchiseFeeSort;
  if (filters.revenueSort) normalized.revenueSort = filters.revenueSort;
  if (filters.roiSort) normalized.roiSort = filters.roiSort;
  if (filters.ratingSort) normalized.ratingSort = filters.ratingSort;
  if (filters.nameSort) normalized.nameSort = filters.nameSort;

  // Sort keys to ensure consistent hashing
  const sortedKeys = Object.keys(normalized).sort();
  const sortedObject: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    sortedObject[key] = normalized[key];
  }

  // Create hash from normalized filters
  const filterString = JSON.stringify(sortedObject);
  const hash = createHash('sha256')
    .update(filterString)
    .digest('hex')
    .substring(0, 16);

  return `franchise:list:${hash}`;
}

/**
 * Generate a cache key for a single franchise by ID
 */
export function generateFranchiseCacheKey(id: string): string {
  return `franchise:${id}`;
}
