'use client'

import {
  sortDirectionToApi,
  useRankingFilters,
  type SortCriterion,
  type SortFilters,
  type UseRankingFiltersReturn,
  type ValueFilters,
} from '@/src/hooks/ranking/useRankingFilters'
import React, { createContext } from 'react'

// =============================================================================
// RE-EXPORT TYPES FOR BACKWARD COMPATIBILITY
// =============================================================================

export type { SortCriterion, SortFilters, ValueFilters }

// =============================================================================
// CONTEXT TYPE (matches UseRankingFiltersReturn for compatibility)
// =============================================================================

export type RankingContextType = UseRankingFiltersReturn

// =============================================================================
// CONTEXT
// =============================================================================

export const RankingContext = createContext<RankingContextType>(
  {} as RankingContextType,
)

// =============================================================================
// PROVIDER
// Uses the nuqs-based hook internally
// =============================================================================

export const RankingProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const rankingFilters = useRankingFilters()

  return (
    <RankingContext.Provider value={rankingFilters}>
      {children}
    </RankingContext.Provider>
  )
}

// =============================================================================
// RE-EXPORT HOOK AND HELPER FOR DIRECT USAGE
// =============================================================================

export { sortDirectionToApi, useRankingFilters }

// =============================================================================
// CONVENIENCE HOOK: Use context with type safety
// =============================================================================

export function useRankingContext(): RankingContextType {
  const context = React.useContext(RankingContext)
  if (!context || Object.keys(context).length === 0) {
    throw new Error('useRankingContext must be used within a RankingProvider')
  }
  return context
}
