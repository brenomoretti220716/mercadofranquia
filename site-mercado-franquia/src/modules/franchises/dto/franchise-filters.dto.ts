/**
 * Franchise Filter DTO
 * Defines all possible filter and sort parameters for franchise queries
 */

export interface FranchiseFiltersDto {
  // =============== PAGINATION ===============
  page?: number;
  limit?: number;

  // =============== TEXT FILTERS ===============
  search?: string; // General text search across multiple fields
  segment?: string; // Segment search (case-insensitive partial match)
  subsegment?: string; // Subsegment search (case-insensitive partial match)
  excludeSubsegment?: string; // Exclude specific subsegment from results

  // =============== RANGE FILTERS (numeric fields) ===============

  // Units
  minUnits?: number;
  maxUnits?: number;

  // Investment
  minInvestment?: number;
  maxInvestment?: number;

  // Franchise Fee
  minFranchiseFee?: number;
  maxFranchiseFee?: number;

  // Revenue
  minRevenue?: number;
  maxRevenue?: number;

  // ROI (Return on Investment in months)
  minROI?: number;
  maxROI?: number;

  // Store Area (square meters)
  minArea?: number;
  maxArea?: number;

  // Foundation Year
  minFoundationYear?: number;
  maxFoundationYear?: number;

  // =============== SPECIAL FILTERS ===============

  // Rating: filter from 0 up to the selected rating (inclusive, 1-5)
  rating?: number;

  // Rating range filters (inclusive, 1-5)
  minRating?: number; // Minimum rating filter
  maxRating?: number; // Maximum rating filter

  // ABF Association
  isAbfAssociated?: boolean;

  // Sponsored status
  isSponsored?: boolean;

  // =============== SORTING ===============

  // Sort parameters: 'asc' | 'desc' | undefined
  // Multiple sorts can be applied (priority by order)

  unitsSort?: 'asc' | 'desc';
  investmentSort?: 'asc' | 'desc';
  franchiseFeeSort?: 'asc' | 'desc';
  revenueSort?: 'asc' | 'desc';
  roiSort?: 'asc' | 'desc';
  ratingSort?: 'asc' | 'desc';
  nameSort?: 'asc' | 'desc';
}

/**
 * Admin-specific filters (extends base filters)
 */
export interface AdminFranchiseFiltersDto extends FranchiseFiltersDto {
  isAdmin?: boolean;
}
