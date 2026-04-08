'use client'

import { Franchise } from '@/src/schemas/franchises/Franchise'
import type { ReactNode } from 'react'
import { useState } from 'react'
import SearchBar from '../home/SearchBar'
import { Pagination } from '../ui/Pagination'
import RankingCard from './RankingCard'
import RankingTableView from './RankingTableView'
import ViewModeToggle from './ViewModeToggle'
import RankingTableSkeleton from '../ui/skeletons/RankingTableSkeleton'

interface RankingDisplayProps {
  franchises: Franchise[]
  isLoading: boolean
  isFetching?: boolean
  page: number
  lastPage: number
  total: number
  onPageChange: (page: number) => void
  onFranchiseClick: (franchiseSlug: string) => void
  title?: string
  subtitle?: string
  showPagination?: boolean
  showViewToggle?: boolean
  defaultViewMode?: 'cards' | 'table'
  onAdvancedFiltersClick?: () => void
  hasActiveFilters?: boolean
  isFiltersOpen?: boolean
  filtersContent?: ReactNode
  contentBetweenFiltersAndList?: ReactNode
}

const RankingDisplay = ({
  franchises,
  isLoading,
  isFetching = false,
  page,
  lastPage,
  total,
  onPageChange,
  onFranchiseClick,
  title = '📊 Ranking Completo',
  subtitle = 'Todas as franquias avaliadas, ordenadas por nota',
  showPagination = true,
  showViewToggle = true,
  defaultViewMode = 'table',
  onAdvancedFiltersClick,
  hasActiveFilters = false,
  isFiltersOpen = false,
  filtersContent,
  contentBetweenFiltersAndList,
}: RankingDisplayProps) => {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(defaultViewMode)
  const showAdvancedFilters = Boolean(onAdvancedFiltersClick)

  return (
    <div>
      {/* Title and subtitle first */}
      <div className="mb-6">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          {title}
        </h2>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>

      {/* Search bar with optional advanced filters accordion inside same container */}
      <SearchBar
        showAdvancedFilters={showAdvancedFilters}
        onAdvancedFiltersClick={onAdvancedFiltersClick}
        hasActiveFilters={hasActiveFilters}
        isFiltersOpen={isFiltersOpen}
        filtersContent={filtersContent}
      />

      {contentBetweenFiltersAndList}

      {/* View toggle right-aligned */}
      {showViewToggle && (
        <div className="flex justify-end mb-8">
          <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
        </div>
      )}

      {/* Loading State — skeleton for first load and when loading next page */}
      {(isLoading || isFetching) && <RankingTableSkeleton />}

      {/* Empty State */}
      {!isLoading && !isFetching && franchises.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma franquia encontrada
        </div>
      )}

      {/* Cards View */}
      {!isLoading &&
        !isFetching &&
        franchises.length > 0 &&
        viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {franchises.map((franchise) => {
              const position = franchise.rankingPosition || 0
              return (
                <RankingCard
                  key={franchise.id}
                  franchise={franchise}
                  position={position}
                  onClick={onFranchiseClick}
                />
              )
            })}
          </div>
        )}

      {/* Table View */}
      {!isLoading &&
        !isFetching &&
        franchises.length > 0 &&
        viewMode === 'table' && (
          <RankingTableView
            franchises={franchises}
            onClick={onFranchiseClick}
            id="ranking-list"
          />
        )}

      {/* Pagination */}
      {showPagination && !isLoading && !isFetching && franchises.length > 0 && (
        <div className="flex justify-center mt-8">
          <Pagination
            page={page}
            total={total}
            limit={Math.ceil(total / lastPage)}
            onPageChange={onPageChange}
            scrollToId="ranking-list"
            scrollMarginTop={96}
          />
        </div>
      )}
    </div>
  )
}

export default RankingDisplay
