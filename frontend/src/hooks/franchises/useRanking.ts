import Api from '@/src/api/Api'
import { franchiseQueries } from '@/src/queries/franchises'
import type { Franchise } from '@/src/schemas/franchises/Franchise'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'

export interface UseFranchiseRankingOptions {
  enabled?: boolean
  staleTime?: number
  refetchOnWindowFocus?: boolean
}

export interface UseFranchiseRankingProps {
  slug: string
  search?: string
  // Sorting
  nameSort?: 'asc' | 'desc' | null
  ratingSort?: 'asc' | 'desc' | null
  unitsSort?: 'asc' | 'desc' | null
  investmentSort?: 'asc' | 'desc' | null
  roiSort?: 'asc' | 'desc' | null
  franchiseFeeSort?: 'asc' | 'desc' | null
  revenueSort?: 'asc' | 'desc' | null
  // Range filters
  minInvestment?: string
  maxInvestment?: string
  minROI?: string
  maxROI?: string
  minFranchiseFee?: string
  maxFranchiseFee?: string
  minRevenue?: string
  maxRevenue?: string
  minUnits?: string
  maxUnits?: string
  rating?: number | null
  // Segment filter
  segment?: string
  options?: UseFranchiseRankingOptions
}

export interface UseRankingPaginatedProps {
  page?: number
  limit?: number
  token?: string
  search?: string
  // Sorting
  nameSort?: 'asc' | 'desc' | null
  ratingSort?: 'asc' | 'desc' | null
  unitsSort?: 'asc' | 'desc' | null
  investmentSort?: 'asc' | 'desc' | null
  roiSort?: 'asc' | 'desc' | null
  franchiseFeeSort?: 'asc' | 'desc' | null
  revenueSort?: 'asc' | 'desc' | null
  // Range filters
  minInvestment?: string
  maxInvestment?: string
  minROI?: string
  maxROI?: string
  minFranchiseFee?: string
  maxFranchiseFee?: string
  minRevenue?: string
  maxRevenue?: string
  minUnits?: string
  maxUnits?: string
  rating?: number | null
  minRating?: number | null
  maxRating?: number | null
  // Segment filter
  segment?: string
  subsegment?: string
  excludeSubsegment?: string
  options?: UseFranchiseRankingOptions
}

interface FranchiseRanking {
  franchiseWithRanking: Franchise
  nextFranchiseWithRanking: string | null
  previousFranchiseWithRanking: string | null
}

// TODO: move this fetch to services/franchises.ts if reused elsewhere
const fetchFranchiseRanking = async (
  slug: string,
  filters: {
    search?: string
    nameSort?: 'asc' | 'desc' | null
    ratingSort?: 'asc' | 'desc' | null
    unitsSort?: 'asc' | 'desc' | null
    investmentSort?: 'asc' | 'desc' | null
    roiSort?: 'asc' | 'desc' | null
    franchiseFeeSort?: 'asc' | 'desc' | null
    revenueSort?: 'asc' | 'desc' | null
    minInvestment?: string
    maxInvestment?: string
    minROI?: string
    maxROI?: string
    minFranchiseFee?: string
    maxFranchiseFee?: string
    minRevenue?: string
    maxRevenue?: string
    minUnits?: string
    maxUnits?: string
    rating?: number | null
    segment?: string
  },
): Promise<FranchiseRanking> => {
  const searchParams = new URLSearchParams()

  // Add search
  if (filters.search) searchParams.set('search', filters.search)

  // Add sorting parameters
  if (filters.nameSort) searchParams.set('nameSort', filters.nameSort)
  if (filters.ratingSort) searchParams.set('ratingSort', filters.ratingSort)
  if (filters.unitsSort) searchParams.set('unitsSort', filters.unitsSort)
  if (filters.investmentSort)
    searchParams.set('investmentSort', filters.investmentSort)
  if (filters.roiSort) searchParams.set('roiSort', filters.roiSort)
  if (filters.franchiseFeeSort)
    searchParams.set('franchiseFeeSort', filters.franchiseFeeSort)
  if (filters.revenueSort) searchParams.set('revenueSort', filters.revenueSort)

  // Add range filters
  if (filters.minInvestment)
    searchParams.set('minInvestment', filters.minInvestment)
  if (filters.maxInvestment)
    searchParams.set('maxInvestment', filters.maxInvestment)
  if (filters.minROI) searchParams.set('minROI', filters.minROI)
  if (filters.maxROI) searchParams.set('maxROI', filters.maxROI)
  if (filters.minFranchiseFee)
    searchParams.set('minFranchiseFee', filters.minFranchiseFee)
  if (filters.maxFranchiseFee)
    searchParams.set('maxFranchiseFee', filters.maxFranchiseFee)
  if (filters.minRevenue) searchParams.set('minRevenue', filters.minRevenue)
  if (filters.maxRevenue) searchParams.set('maxRevenue', filters.maxRevenue)
  if (filters.minUnits) searchParams.set('minUnits', filters.minUnits)
  if (filters.maxUnits) searchParams.set('maxUnits', filters.maxUnits)
  if (filters.rating !== null && filters.rating !== undefined)
    searchParams.set('rating', String(filters.rating))
  if (filters.segment) searchParams.set('segment', filters.segment)

  const endpoint = `/franchises/${slug}/ranking${searchParams.toString() ? `?${searchParams.toString()}` : ''}`

  try {
    const response = await fetch(Api(endpoint), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return {
        franchiseWithRanking: null as unknown as Franchise,
        nextFranchiseWithRanking: null,
        previousFranchiseWithRanking: null,
      }
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    // During build/SSR when API is unavailable, return empty data
    // This prevents build failures when API isn't accessible
    if (
      typeof window === 'undefined' ||
      (error as Error)?.name === 'AbortError' ||
      (error as Error)?.message?.includes('fetch failed')
    ) {
      return {
        franchiseWithRanking: null as unknown as Franchise,
        nextFranchiseWithRanking: null,
        previousFranchiseWithRanking: null,
      }
    }
    throw error
  }
}

export function useFranchiseRanking({
  slug,
  search,
  nameSort,
  ratingSort,
  unitsSort,
  investmentSort,
  roiSort,
  franchiseFeeSort,
  revenueSort,
  minInvestment,
  maxInvestment,
  minROI,
  maxROI,
  minFranchiseFee,
  maxFranchiseFee,
  minRevenue,
  maxRevenue,
  minUnits,
  maxUnits,
  rating,
  segment,
  options,
}: UseFranchiseRankingProps) {
  const { staleTime = 1000 * 60 * 5, refetchOnWindowFocus = false } =
    options || {}

  const { data } = useSuspenseQuery({
    queryKey: [
      'franchise-ranking',
      slug,
      search,
      nameSort,
      ratingSort,
      unitsSort,
      investmentSort,
      roiSort,
      franchiseFeeSort,
      revenueSort,
      minInvestment,
      maxInvestment,
      minROI,
      maxROI,
      minFranchiseFee,
      maxFranchiseFee,
      minRevenue,
      maxRevenue,
      minUnits,
      maxUnits,
      rating,
      segment,
    ],
    queryFn: () =>
      fetchFranchiseRanking(slug, {
        search,
        nameSort,
        ratingSort,
        unitsSort,
        investmentSort,
        roiSort,
        franchiseFeeSort,
        revenueSort,
        minInvestment,
        maxInvestment,
        minROI,
        maxROI,
        minFranchiseFee,
        maxFranchiseFee,
        minRevenue,
        maxRevenue,
        minUnits,
        maxUnits,
        rating,
        segment,
      }),
    staleTime,
    refetchOnWindowFocus,
  })
  return {
    franchise: data.franchiseWithRanking,
    nextFranchise: data.nextFranchiseWithRanking,
    previousFranchise: data.previousFranchiseWithRanking,
  }
}

export const useRankingPaginated = ({
  page = 1,
  limit = 10,
  search = '',
  nameSort,
  ratingSort,
  unitsSort,
  investmentSort,
  roiSort,
  franchiseFeeSort,
  revenueSort,
  minInvestment,
  maxInvestment,
  minROI,
  maxROI,
  minFranchiseFee,
  maxFranchiseFee,
  minRevenue,
  maxRevenue,
  minUnits,
  maxUnits,
  rating,
  minRating,
  maxRating,
  segment,
  subsegment,
  excludeSubsegment,
}: UseRankingPaginatedProps) => {
  const { data, isLoading, isFetching } = useQuery(
    franchiseQueries.paginated({
      page,
      limit,
      search,
      nameSort,
      ratingSort,
      unitsSort,
      investmentSort,
      roiSort,
      franchiseFeeSort,
      revenueSort,
      minInvestment,
      maxInvestment,
      minROI,
      maxROI,
      minFranchiseFee,
      maxFranchiseFee,
      minRevenue,
      maxRevenue,
      minUnits,
      maxUnits,
      rating,
      minRating,
      maxRating,
      segment,
      subsegment,
      excludeSubsegment,
    }),
  )

  return {
    franchises: data && data.data ? data.data : [],
    total: data && typeof data.total === 'number' ? data.total : 0,
    page: data && typeof data.page === 'number' ? data.page : page,
    lastPage: data && typeof data.lastPage === 'number' ? data.lastPage : 1,
    isLoading,
    isFetching,
  }
}

export interface UseAdminRankingPaginatedProps {
  page?: number
  limit?: number
  token?: string
  search?: string
  isSponsored?: boolean
}

export const useAdminRankingPaginated = ({
  page = 1,
  limit = 10,
  token,
  search = '',
  isSponsored,
}: UseAdminRankingPaginatedProps) => {
  const { data } = useSuspenseQuery(
    franchiseQueries.paginated(
      {
        page,
        limit,
        search,
        isSponsored,
      },
      token,
    ),
  )

  return {
    franchises: data && data.data ? data.data : [],
    total: data && typeof data.total === 'number' ? data.total : 0,
    page: data && typeof data.page === 'number' ? data.page : page,
    lastPage: data && typeof data.lastPage === 'number' ? data.lastPage : 1,
    totalSponsored: data?.totalSponsored,
  }
}
