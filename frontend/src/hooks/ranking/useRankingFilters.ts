'use client'

import { createParser, parseAsString, useQueryStates } from 'nuqs'
import { useCallback, useMemo } from 'react'

// =============================================================================
// TYPES
// =============================================================================

export type SortDirection = boolean | null // null = none, true = asc, false = desc

export type SortCriterion =
  | 'isByDesc'
  | 'isByRatingAverage'
  | 'isByUnits'
  | 'isByInvestment'
  | 'isByReturn'
  | 'isByFranchiseFee'
  | 'isByaverageMonthlyRevenue'

export interface SortFilters {
  isByDesc: SortDirection
  isByRatingAverage: SortDirection
  isByUnits: SortDirection
  isByInvestment: SortDirection
  isByReturn: SortDirection
  isByFranchiseFee: SortDirection
  isByaverageMonthlyRevenue: SortDirection
}

export interface ValueFilters {
  minInvestment: string
  maxInvestment: string
  minROI: string
  maxROI: string
  minFranchiseFee: string
  maxFranchiseFee: string
  minRevenue: string
  maxRevenue: string
  minUnits: string
  maxUnits: string
  rating: number | null
  minRating: number | null
  maxRating: number | null
  segment: string
}

export interface UseRankingFiltersReturn {
  // Combined filters object
  filters: SortFilters
  valueFilters: ValueFilters

  // Sort filter actions
  toggleFilter: (criterion: SortCriterion) => void
  setFilter: (criterion: SortCriterion, value: SortDirection) => void
  resetFilter: (criterion: SortCriterion) => void
  resetAllFilters: () => void

  // Value filter actions
  setValueFilter: <K extends keyof ValueFilters>(
    key: K,
    value: ValueFilters[K],
  ) => void
  resetAllValueFilters: () => void

  // Computed
  hasActiveFilters: boolean

  // URL helpers - build URLs preserving current filter state
  getQueryString: () => string
  buildUrl: (basePath: string) => string

  // Legacy getters (for backward compatibility)
  isByDesc: SortDirection
  isByRatingAverage: SortDirection
  isByUnits: SortDirection
  isByInvestment: SortDirection
  isByReturn: SortDirection
  isByFranchiseFee: SortDirection
  isByaverageMonthlyRevenue: SortDirection

  // Legacy setters (for backward compatibility)
  setIsByDesc: (value: SortDirection) => void
  setIsByRatingAverage: (value: SortDirection) => void
  setIsByUnits: (value: SortDirection) => void
  setIsByInvestment: (value: SortDirection) => void
  setIsByReturn: (value: SortDirection) => void
  setIsByFranchiseFee: (value: SortDirection) => void
  setIsByaverageMonthlyRevenue: (value: SortDirection) => void

  // Legacy reset functions
  resetStates: (state: string) => void
  resetAllStates: () => void
}

// =============================================================================
// CUSTOM PARSERS
// =============================================================================

/**
 * Custom parser for tri-state boolean (null | true | false)
 * URL representation: 'asc' = true, 'desc' = false, absent = null
 */
const parseAsTriStateSort = createParser<SortDirection>({
  parse: (value: string): SortDirection => {
    if (value === 'asc') return true
    if (value === 'desc') return false
    return null
  },
  serialize: (value: SortDirection): string => {
    if (value === true) return 'asc'
    if (value === false) return 'desc'
    return '' // Will be removed from URL
  },
  eq: (a, b) => a === b,
})

/**
 * Custom parser for nullable integer
 */
const parseAsNullableInt = createParser<number | null>({
  parse: (value: string): number | null => {
    const parsed = parseInt(value, 10)
    return isNaN(parsed) ? null : parsed
  },
  serialize: (value: number | null): string => {
    return value === null ? '' : String(value)
  },
  eq: (a, b) => a === b,
})

// =============================================================================
// QUERY STATE SCHEMA
// =============================================================================

const sortFiltersSchema = {
  // Sort filters - mapped to cleaner URL param names
  nameSort: parseAsTriStateSort,
  ratingSort: parseAsTriStateSort,
  unitsSort: parseAsTriStateSort,
  investmentSort: parseAsTriStateSort,
  roiSort: parseAsTriStateSort,
  franchiseFeeSort: parseAsTriStateSort,
  revenueSort: parseAsTriStateSort,
}

const valueFiltersSchema = {
  // Value filters
  minInvestment: parseAsString.withDefault(''),
  maxInvestment: parseAsString.withDefault(''),
  minROI: parseAsString.withDefault(''),
  maxROI: parseAsString.withDefault(''),
  minFranchiseFee: parseAsString.withDefault(''),
  maxFranchiseFee: parseAsString.withDefault(''),
  minRevenue: parseAsString.withDefault(''),
  maxRevenue: parseAsString.withDefault(''),
  minUnits: parseAsString.withDefault(''),
  maxUnits: parseAsString.withDefault(''),
  rating: parseAsNullableInt,
  minRating: parseAsNullableInt,
  maxRating: parseAsNullableInt,
  segment: parseAsString.withDefault(''),
}

// Mapping from internal names to URL param names
const sortKeyToUrlParam: Record<SortCriterion, keyof typeof sortFiltersSchema> =
  {
    isByDesc: 'nameSort',
    isByRatingAverage: 'ratingSort',
    isByUnits: 'unitsSort',
    isByInvestment: 'investmentSort',
    isByReturn: 'roiSort',
    isByFranchiseFee: 'franchiseFeeSort',
    isByaverageMonthlyRevenue: 'revenueSort',
  }

// =============================================================================
// HOOK
// =============================================================================

export function useRankingFilters(): UseRankingFiltersReturn {
  // Sort filters state
  const [sortState, setSortState] = useQueryStates(sortFiltersSchema, {
    history: 'push',
    shallow: true,
  })

  // Value filters state
  const [valueState, setValueState] = useQueryStates(valueFiltersSchema, {
    history: 'push',
    shallow: true,
  })

  // Map URL params back to internal filter names
  const filters: SortFilters = useMemo(
    () => ({
      isByDesc: sortState.nameSort,
      isByRatingAverage: sortState.ratingSort,
      isByUnits: sortState.unitsSort,
      isByInvestment: sortState.investmentSort,
      isByReturn: sortState.roiSort,
      isByFranchiseFee: sortState.franchiseFeeSort,
      isByaverageMonthlyRevenue: sortState.revenueSort,
    }),
    [sortState],
  )

  const valueFilters: ValueFilters = useMemo(
    () => ({
      minInvestment: valueState.minInvestment,
      maxInvestment: valueState.maxInvestment,
      minROI: valueState.minROI,
      maxROI: valueState.maxROI,
      minFranchiseFee: valueState.minFranchiseFee,
      maxFranchiseFee: valueState.maxFranchiseFee,
      minRevenue: valueState.minRevenue,
      maxRevenue: valueState.maxRevenue,
      minUnits: valueState.minUnits,
      maxUnits: valueState.maxUnits,
      rating: valueState.rating,
      minRating: valueState.minRating,
      maxRating: valueState.maxRating,
      segment: valueState.segment,
    }),
    [valueState],
  )

  // =============================================================================
  // SORT FILTER ACTIONS
  // =============================================================================

  const toggleFilter = useCallback(
    (criterion: SortCriterion) => {
      const urlParam = sortKeyToUrlParam[criterion]
      const currentValue = sortState[urlParam]

      let newValue: SortDirection
      if (currentValue === null) {
        newValue = true // First click: ascending
      } else if (currentValue === true) {
        newValue = false // Second click: descending
      } else {
        newValue = null // Third click: remove filter
      }

      setSortState({ [urlParam]: newValue })
    },
    [sortState, setSortState],
  )

  const setFilter = useCallback(
    (criterion: SortCriterion, value: SortDirection) => {
      const urlParam = sortKeyToUrlParam[criterion]
      setSortState({ [urlParam]: value })
    },
    [setSortState],
  )

  const resetFilter = useCallback(
    (criterion: SortCriterion) => {
      const urlParam = sortKeyToUrlParam[criterion]
      setSortState({ [urlParam]: null })
    },
    [setSortState],
  )

  const resetAllFilters = useCallback(() => {
    setSortState({
      nameSort: null,
      ratingSort: null,
      unitsSort: null,
      investmentSort: null,
      roiSort: null,
      franchiseFeeSort: null,
      revenueSort: null,
    })
  }, [setSortState])

  // =============================================================================
  // VALUE FILTER ACTIONS
  // =============================================================================

  const setValueFilter = useCallback(
    <K extends keyof ValueFilters>(key: K, value: ValueFilters[K]) => {
      // nuqs useQueryStates automatically merges partial updates
      setValueState({ [key]: value } as Partial<typeof valueState>)
    },
    [setValueState],
  )

  const resetAllValueFilters = useCallback(() => {
    setValueState({
      minInvestment: '',
      maxInvestment: '',
      minROI: '',
      maxROI: '',
      minFranchiseFee: '',
      maxFranchiseFee: '',
      minRevenue: '',
      maxRevenue: '',
      minUnits: '',
      maxUnits: '',
      rating: null,
      minRating: null,
      maxRating: null,
      segment: '',
    })
  }, [setValueState])

  // =============================================================================
  // COMPUTED
  // =============================================================================

  const hasActiveFilters = useMemo(() => {
    const hasSortFilters = Object.values(sortState).some(
      (value) => value !== null,
    )
    const hasValueFilters = Object.entries(valueState).some(([key, value]) => {
      if (key === 'rating' || key === 'minRating' || key === 'maxRating')
        return value !== null
      return value !== ''
    })
    return hasSortFilters || hasValueFilters
  }, [sortState, valueState])

  // =============================================================================
  // URL HELPERS - Build URLs preserving current filter state
  // =============================================================================

  /**
   * Returns the current query string with all active filters
   * Example: "?nameSort=asc&minInvestment=50000"
   */
  const getQueryString = useCallback((): string => {
    const params = new URLSearchParams()

    // Add sort filters
    if (sortState.nameSort !== null) {
      params.set('nameSort', sortState.nameSort ? 'asc' : 'desc')
    }
    if (sortState.ratingSort !== null) {
      params.set('ratingSort', sortState.ratingSort ? 'asc' : 'desc')
    }
    if (sortState.unitsSort !== null) {
      params.set('unitsSort', sortState.unitsSort ? 'asc' : 'desc')
    }
    if (sortState.investmentSort !== null) {
      params.set('investmentSort', sortState.investmentSort ? 'asc' : 'desc')
    }
    if (sortState.roiSort !== null) {
      params.set('roiSort', sortState.roiSort ? 'asc' : 'desc')
    }
    if (sortState.franchiseFeeSort !== null) {
      params.set(
        'franchiseFeeSort',
        sortState.franchiseFeeSort ? 'asc' : 'desc',
      )
    }
    if (sortState.revenueSort !== null) {
      params.set('revenueSort', sortState.revenueSort ? 'asc' : 'desc')
    }

    // Add value filters
    if (valueState.minInvestment) {
      params.set('minInvestment', valueState.minInvestment)
    }
    if (valueState.maxInvestment) {
      params.set('maxInvestment', valueState.maxInvestment)
    }
    if (valueState.minROI) {
      params.set('minROI', valueState.minROI)
    }
    if (valueState.maxROI) {
      params.set('maxROI', valueState.maxROI)
    }
    if (valueState.minFranchiseFee) {
      params.set('minFranchiseFee', valueState.minFranchiseFee)
    }
    if (valueState.maxFranchiseFee) {
      params.set('maxFranchiseFee', valueState.maxFranchiseFee)
    }
    if (valueState.minRevenue) {
      params.set('minRevenue', valueState.minRevenue)
    }
    if (valueState.maxRevenue) {
      params.set('maxRevenue', valueState.maxRevenue)
    }
    if (valueState.minUnits) {
      params.set('minUnits', valueState.minUnits)
    }
    if (valueState.maxUnits) {
      params.set('maxUnits', valueState.maxUnits)
    }
    if (valueState.rating !== null) {
      params.set('rating', String(valueState.rating))
    }
    if (valueState.minRating !== null) {
      params.set('minRating', String(valueState.minRating))
    }
    if (valueState.maxRating !== null) {
      params.set('maxRating', String(valueState.maxRating))
    }
    if (valueState.segment) {
      params.set('segment', valueState.segment)
    }

    const queryString = params.toString()
    return queryString ? `?${queryString}` : ''
  }, [sortState, valueState])

  /**
   * Builds a URL with the base path and current query string
   * Example: buildUrl('/ranking/abc123') => '/ranking/abc123?nameSort=asc'
   */
  const buildUrl = useCallback(
    (basePath: string): string => {
      return `${basePath}${getQueryString()}`
    },
    [getQueryString],
  )

  // =============================================================================
  // LEGACY SETTERS (for backward compatibility)
  // =============================================================================

  const setIsByDesc = useCallback(
    (value: SortDirection) => setFilter('isByDesc', value),
    [setFilter],
  )
  const setIsByRatingAverage = useCallback(
    (value: SortDirection) => setFilter('isByRatingAverage', value),
    [setFilter],
  )
  const setIsByUnits = useCallback(
    (value: SortDirection) => setFilter('isByUnits', value),
    [setFilter],
  )
  const setIsByInvestment = useCallback(
    (value: SortDirection) => setFilter('isByInvestment', value),
    [setFilter],
  )
  const setIsByReturn = useCallback(
    (value: SortDirection) => setFilter('isByReturn', value),
    [setFilter],
  )
  const setIsByFranchiseFee = useCallback(
    (value: SortDirection) => setFilter('isByFranchiseFee', value),
    [setFilter],
  )
  const setIsByaverageMonthlyRevenue = useCallback(
    (value: SortDirection) => setFilter('isByaverageMonthlyRevenue', value),
    [setFilter],
  )

  // Legacy reset functions
  const resetStates = useCallback(() => {
    // No-op for backward compatibility (was already empty in original)
  }, [])

  const resetAllStates = useCallback(() => {
    resetAllFilters()
    resetAllValueFilters()
  }, [resetAllFilters, resetAllValueFilters])

  return {
    // Combined filters
    filters,
    valueFilters,

    // Sort filter actions
    toggleFilter,
    setFilter,
    resetFilter,
    resetAllFilters,

    // Value filter actions
    setValueFilter,
    resetAllValueFilters,

    // Computed
    hasActiveFilters,

    // URL helpers
    getQueryString,
    buildUrl,

    // Legacy getters
    isByDesc: filters.isByDesc,
    isByRatingAverage: filters.isByRatingAverage,
    isByUnits: filters.isByUnits,
    isByInvestment: filters.isByInvestment,
    isByReturn: filters.isByReturn,
    isByFranchiseFee: filters.isByFranchiseFee,
    isByaverageMonthlyRevenue: filters.isByaverageMonthlyRevenue,

    // Legacy setters
    setIsByDesc,
    setIsByRatingAverage,
    setIsByUnits,
    setIsByInvestment,
    setIsByReturn,
    setIsByFranchiseFee,
    setIsByaverageMonthlyRevenue,

    // Legacy reset
    resetStates,
    resetAllStates,
  }
}

// =============================================================================
// HELPER: Convert tri-state to API sort direction
// =============================================================================

export function sortDirectionToApi(
  value: SortDirection,
): 'asc' | 'desc' | null {
  if (value === null) return null
  return value ? 'asc' : 'desc'
}
