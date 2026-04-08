import { FranchiseFiltersDto } from '../dto/franchise-filters.dto';

/**
 * Parse query parameters into FranchiseFiltersDto
 * Handles type conversions and validation
 */
export function parseQueryToFilters(
  query: Record<string, any>,
): FranchiseFiltersDto {
  const filters: FranchiseFiltersDto = {};

  // Pagination
  if (query.page) filters.page = parseInt(query.page, 10);
  if (query.limit) filters.limit = parseInt(query.limit, 10);

  // Text filters
  if (query.search) filters.search = query.search as string;
  if (query.segment) filters.segment = query.segment as string;
  if (query.subsegment) filters.subsegment = query.subsegment as string;
  if (query.excludeSubsegment)
    filters.excludeSubsegment = query.excludeSubsegment as string;

  // Range filters - Units
  if (query.minUnits) filters.minUnits = parseFloat(query.minUnits);
  if (query.maxUnits) filters.maxUnits = parseFloat(query.maxUnits);

  // Range filters - Investment
  if (query.minInvestment)
    filters.minInvestment = parseFloat(query.minInvestment);
  if (query.maxInvestment)
    filters.maxInvestment = parseFloat(query.maxInvestment);

  // Range filters - Franchise Fee
  if (query.minFranchiseFee)
    filters.minFranchiseFee = parseFloat(query.minFranchiseFee);
  if (query.maxFranchiseFee)
    filters.maxFranchiseFee = parseFloat(query.maxFranchiseFee);

  // Range filters - Revenue
  if (query.minRevenue) filters.minRevenue = parseFloat(query.minRevenue);
  if (query.maxRevenue) filters.maxRevenue = parseFloat(query.maxRevenue);

  // Range filters - ROI
  if (query.minROI) filters.minROI = parseFloat(query.minROI);
  if (query.maxROI) filters.maxROI = parseFloat(query.maxROI);

  // Range filters - Area
  if (query.minArea) filters.minArea = parseFloat(query.minArea);
  if (query.maxArea) filters.maxArea = parseFloat(query.maxArea);

  // Range filters - Foundation Year
  if (query.minFoundationYear)
    filters.minFoundationYear = parseInt(query.minFoundationYear, 10);
  if (query.maxFoundationYear)
    filters.maxFoundationYear = parseInt(query.maxFoundationYear, 10);

  // Special filters
  if (query.rating) filters.rating = parseFloat(query.rating);
  if (query.minRating) filters.minRating = parseFloat(query.minRating);
  if (query.maxRating) filters.maxRating = parseFloat(query.maxRating);
  if (query.isAbfAssociated)
    filters.isAbfAssociated = query.isAbfAssociated === 'true';
  if (query.isSponsored !== undefined) {
    filters.isSponsored = query.isSponsored === 'true';
  }

  // Sort parameters
  if (query.unitsSort) filters.unitsSort = query.unitsSort as 'asc' | 'desc';
  if (query.investmentSort)
    filters.investmentSort = query.investmentSort as 'asc' | 'desc';
  if (query.franchiseFeeSort)
    filters.franchiseFeeSort = query.franchiseFeeSort as 'asc' | 'desc';
  if (query.revenueSort)
    filters.revenueSort = query.revenueSort as 'asc' | 'desc';
  if (query.roiSort) filters.roiSort = query.roiSort as 'asc' | 'desc';
  if (query.ratingSort) filters.ratingSort = query.ratingSort as 'asc' | 'desc';
  if (query.nameSort) filters.nameSort = query.nameSort as 'asc' | 'desc';

  return filters;
}
