import { Prisma } from '@prisma/client';
import { FranchiseFiltersDto } from '../dto/franchise-filters.dto';

/**
 * Build Prisma WHERE clause from filter parameters
 */
export function buildFranchiseWhereClause(
  filters: FranchiseFiltersDto,
  isActiveOnly = true,
): Prisma.FranchiseWhereInput {
  const where: Prisma.FranchiseWhereInput = {};

  // Active status filter
  if (isActiveOnly) {
    where.isActive = true;
  }

  // ============= CATEGORICAL FILTERS =============

  // Segment filter (case-insensitive partial match)
  if (filters.segment && filters.segment.trim()) {
    where.segment = {
      contains: filters.segment.trim().toLowerCase(),
    };
  }

  // Subsegment filter (case-insensitive partial match)
  if (filters.subsegment && filters.subsegment.trim()) {
    where.subsegment = {
      contains: filters.subsegment.trim().toLowerCase(),
    };
  }

  // Exclude specific subsegment while allowing nulls
  if (filters.excludeSubsegment && filters.excludeSubsegment.trim()) {
    const excluded = filters.excludeSubsegment.trim().toLowerCase();

    if (!where.AND) {
      where.AND = [];
    }

    if (Array.isArray(where.AND)) {
      where.AND.push({
        OR: [
          { subsegment: null },
          {
            subsegment: {
              not: {
                contains: excluded,
              },
            },
          },
        ],
      });
    }
  }

  // ABF Association filter
  if (filters.isAbfAssociated !== undefined) {
    where.isAbfAssociated = filters.isAbfAssociated;
  }

  // Sponsored status filter
  if (filters.isSponsored !== undefined) {
    where.isSponsored = filters.isSponsored;
  }

  // ============= RANGE FILTERS =============

  // Units range
  if (filters.minUnits !== undefined || filters.maxUnits !== undefined) {
    where.totalUnits = {};
    if (filters.minUnits !== undefined) {
      where.totalUnits.gte = filters.minUnits;
    }
    if (filters.maxUnits !== undefined) {
      where.totalUnits.lte = filters.maxUnits;
    }
  }

  // Investment range (uses range overlap logic)
  // Filter franchises where their investment range overlaps with user's desired range
  // ALWAYS exclude franchises with invalid investment data (0 values)
  if (
    filters.minInvestment !== undefined ||
    filters.maxInvestment !== undefined
  ) {
    const conditions: Prisma.FranchiseWhereInput[] = [];

    // Exclude franchises with zero or invalid investment values
    conditions.push({
      OR: [{ minimumInvestment: { gt: 0 } }, { maximumInvestment: { gt: 0 } }],
    });

    if (
      filters.minInvestment !== undefined &&
      filters.maxInvestment !== undefined
    ) {
      // User has a specific range - find franchises that overlap with [min, max]
      conditions.push({
        OR: [
          // Franchise minimum is within user's range
          {
            minimumInvestment: {
              gte: filters.minInvestment,
              lte: filters.maxInvestment,
            },
          },
          // Franchise maximum is within user's range
          {
            maximumInvestment: {
              gte: filters.minInvestment,
              lte: filters.maxInvestment,
            },
          },
          // Franchise range completely contains user's range
          {
            AND: [
              { minimumInvestment: { lte: filters.minInvestment } },
              {
                OR: [
                  { maximumInvestment: { gte: filters.maxInvestment } },
                  { maximumInvestment: null }, // no max means unlimited
                ],
              },
            ],
          },
        ],
      });
      // Exige minimumInvestment >= userMin para não incluir faixas que começam bem abaixo (ex. 1.130, 18k)
      conditions.push({
        minimumInvestment: { gte: filters.minInvestment },
      });
    } else if (filters.minInvestment !== undefined) {
      // Usuário informou só o mínimo: exibir franquias cujo investimento mínimo >= X
      conditions.push({
        minimumInvestment: { gte: filters.minInvestment },
      });
    } else if (filters.maxInvestment !== undefined) {
      // User only specified maximum - match franchises with min <= max
      conditions.push({
        minimumInvestment: { lte: filters.maxInvestment },
      });
    }

    if (conditions.length > 0) {
      if (!where.AND) {
        where.AND = [];
      }
      if (Array.isArray(where.AND)) {
        where.AND.push(...conditions);
      }
    }
  }

  // Franchise Fee range
  if (
    filters.minFranchiseFee !== undefined ||
    filters.maxFranchiseFee !== undefined
  ) {
    where.franchiseFee = {};
    if (filters.minFranchiseFee !== undefined) {
      where.franchiseFee.gte = filters.minFranchiseFee;
    }
    if (filters.maxFranchiseFee !== undefined) {
      where.franchiseFee.lte = filters.maxFranchiseFee;
    }
  }

  // Revenue range
  if (filters.minRevenue !== undefined || filters.maxRevenue !== undefined) {
    where.averageMonthlyRevenue = {};
    if (filters.minRevenue !== undefined) {
      where.averageMonthlyRevenue.gte = filters.minRevenue;
    }
    if (filters.maxRevenue !== undefined) {
      where.averageMonthlyRevenue.lte = filters.maxRevenue;
    }
  }

  // ROI range (months - uses range overlap logic)
  if (filters.minROI !== undefined || filters.maxROI !== undefined) {
    const conditions: Prisma.FranchiseWhereInput[] = [];

    if (filters.minROI !== undefined && filters.maxROI !== undefined) {
      // User has a specific range - find franchises that overlap
      conditions.push({
        OR: [
          // Franchise minimum ROI is within user's range
          {
            minimumReturnOnInvestment: {
              gte: filters.minROI,
              lte: filters.maxROI,
            },
          },
          // Franchise maximum ROI is within user's range
          {
            maximumReturnOnInvestment: {
              gte: filters.minROI,
              lte: filters.maxROI,
            },
          },
          // Franchise range completely contains user's range
          {
            AND: [
              { minimumReturnOnInvestment: { lte: filters.minROI } },
              {
                OR: [
                  { maximumReturnOnInvestment: { gte: filters.maxROI } },
                  { maximumReturnOnInvestment: null },
                ],
              },
            ],
          },
        ],
      });
      // Exige minimumReturnOnInvestment >= userMin para não incluir faixas que começam bem abaixo
      conditions.push({
        minimumReturnOnInvestment: { gte: filters.minROI },
      });
    } else if (filters.minROI !== undefined) {
      // Usuário informou só o mínimo: exibir franquias cujo ROI mínimo >= X
      conditions.push({
        minimumReturnOnInvestment: { gte: filters.minROI },
      });
    } else if (filters.maxROI !== undefined) {
      // User only specified maximum
      conditions.push({
        minimumReturnOnInvestment: { lte: filters.maxROI },
      });
    }

    if (conditions.length > 0) {
      if (!where.AND) {
        where.AND = [];
      }
      if (Array.isArray(where.AND)) {
        where.AND.push(...conditions);
      }
    }
  }

  // Area range (square meters)
  if (filters.minArea !== undefined || filters.maxArea !== undefined) {
    where.storeArea = {};
    if (filters.minArea !== undefined) {
      where.storeArea.gte = filters.minArea;
    }
    if (filters.maxArea !== undefined) {
      where.storeArea.lte = filters.maxArea;
    }
  }

  // Foundation Year range
  if (
    filters.minFoundationYear !== undefined ||
    filters.maxFoundationYear !== undefined
  ) {
    where.brandFoundationYear = {};
    if (filters.minFoundationYear !== undefined) {
      where.brandFoundationYear.gte = filters.minFoundationYear;
    }
    if (filters.maxFoundationYear !== undefined) {
      where.brandFoundationYear.lte = filters.maxFoundationYear;
    }
  }

  // ============= SPECIAL FILTERS =============

  // Rating range filter (preferred over single rating)
  if (filters.minRating !== undefined || filters.maxRating !== undefined) {
    where.averageRating = {};
    if (filters.minRating !== undefined) {
      where.averageRating.gte = filters.minRating;
    }
    if (filters.maxRating !== undefined) {
      where.averageRating.lte = filters.maxRating;
    }
  } else if (filters.rating !== undefined) {
    // Legacy single rating support: filter from 0 up to the selected rating (inclusive)
    const roundedRating = Math.round(filters.rating);
    where.averageRating = {
      lte: roundedRating,
    };
  }

  // ============= TEXT SEARCH =============

  // General search (OR across multiple fields)
  if (filters.search && filters.search.trim()) {
    const lowerSearch = filters.search.toLowerCase();
    const numericSearch = Number(lowerSearch);

    const orConditions: Prisma.FranchiseWhereInput[] = [
      { name: { contains: lowerSearch } },
      { segment: { contains: lowerSearch } },
      { subsegment: { contains: lowerSearch } },
      { businessType: { contains: lowerSearch } },
      { headquarterState: { contains: lowerSearch } },
      { scrapedWebsite: { contains: lowerSearch } },
    ];

    // Add numeric search if valid number
    if (Number.isFinite(numericSearch)) {
      orConditions.push({ totalUnits: numericSearch });
      orConditions.push({ totalUnitsInBrazil: numericSearch });
      orConditions.push({ minimumInvestment: numericSearch });
      orConditions.push({ maximumInvestment: numericSearch });
      orConditions.push({ franchiseFee: numericSearch });
      orConditions.push({ averageMonthlyRevenue: numericSearch });
      orConditions.push({
        minimumReturnOnInvestment: Math.round(numericSearch),
      });
      orConditions.push({
        maximumReturnOnInvestment: Math.round(numericSearch),
      });
    }

    where.OR = orConditions;
  }

  return where;
}
