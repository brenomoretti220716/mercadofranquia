import { Prisma } from '@prisma/client';
import { FranchiseFiltersDto } from '../dto/franchise-filters.dto';

/**
 * Build Prisma ORDER BY clause from sort parameters
 * Multiple sorts can be applied - order matters for priority
 */
export function buildFranchiseOrderByClause(
  filters: FranchiseFiltersDto,
): Prisma.FranchiseOrderByWithRelationInput[] {
  const orderBy: Prisma.FranchiseOrderByWithRelationInput[] = [];

  // Add sorts in the order they're defined (priority matters)

  if (filters.unitsSort) {
    orderBy.push({ totalUnits: filters.unitsSort });
  }

  if (filters.ratingSort) {
    orderBy.push({ averageRating: filters.ratingSort });
  }

  if (filters.investmentSort) {
    orderBy.push({ minimumInvestment: filters.investmentSort });
  }

  if (filters.franchiseFeeSort) {
    orderBy.push({ franchiseFee: filters.franchiseFeeSort });
  }

  if (filters.revenueSort) {
    orderBy.push({ averageMonthlyRevenue: filters.revenueSort });
  }

  if (filters.roiSort) {
    orderBy.push({ minimumReturnOnInvestment: filters.roiSort });
  }

  if (filters.nameSort) {
    orderBy.push({ name: filters.nameSort });
  }

  // Default sort if no sort parameters provided
  if (orderBy.length === 0) {
    orderBy.push({ totalUnits: 'desc' });
    orderBy.push({ name: 'asc' });
  } else {
    // Always add name as final tiebreaker
    orderBy.push({ name: 'asc' });
  }

  return orderBy;
}
