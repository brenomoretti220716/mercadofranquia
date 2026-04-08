'use client'

import { Pagination } from '@/src/components/ui/Pagination'
import { franchiseQueries } from '@/src/queries/franchises'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import FranchiseCategoryCard from './FranchiseCategoryCard'

interface FranchisesByCategoryProps {
  category: string
  segment?: string
  subsegment?: string
  excludeSubsegment?: string
  minInvestment?: string
  maxInvestment?: string
  isFiltered?: boolean
  onVerMais?: () => void
}

const SKELETON_COUNT_DEFAULT = 5
const SKELETON_COUNT_FILTERED = 6

const FranchisesByCategory = ({
  category,
  segment,
  subsegment,
  excludeSubsegment,
  minInvestment,
  maxInvestment,
  isFiltered = false,
  onVerMais,
}: FranchisesByCategoryProps) => {
  const [page, setPage] = useState(1)
  const limit = isFiltered ? 6 : 5

  const { data, isLoading, isFetching } = useQuery(
    franchiseQueries.paginated({
      page,
      limit,
      segment: segment ?? category,
      subsegment,
      excludeSubsegment,
      minInvestment,
      maxInvestment,
    }),
  )

  const franchises = data?.data || []
  const total = data?.total ?? 0
  const skeletonCount = isFiltered
    ? SKELETON_COUNT_FILTERED
    : SKELETON_COUNT_DEFAULT

  const handlePageChange = (next: number) => setPage(next)

  return (
    <div id={`category-${category}`} className="mb-8 md:mb-12">
      <h3 className="text-2xl md:text-3xl font-bold text-[#6B7280] mb-4 md:mb-6">
        {category}
      </h3>

      {(isFiltered ? isLoading || isFetching : isLoading) ? (
        <div
          className={
            isFiltered
              ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6'
              : 'flex gap-4 overflow-x-auto scrollbar-hide md:grid md:grid-cols-3 lg:grid-cols-6 md:overflow-visible md:gap-6'
          }
        >
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div
              key={i}
              className={`animate-pulse ${isFiltered ? 'w-full' : 'flex-shrink-0 w-[180px]'}`}
            >
              <div className="w-full aspect-square bg-secondary rounded-xl border border-border mb-3" />
              <div className="h-4 bg-secondary rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : franchises.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nenhuma franquia encontrada nesta categoria
        </p>
      ) : (
        <>
          <div
            className={
              isFiltered
                ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 pb-2'
                : 'flex gap-4 overflow-x-auto scrollbar-hide md:grid md:grid-cols-3 lg:grid-cols-6 md:overflow-visible md:gap-6 pb-2'
            }
          >
            {franchises.map((franchise) => (
              <FranchiseCategoryCard
                key={franchise.id}
                slug={franchise.slug}
                name={franchise.name}
                logoUrl={franchise.logoUrl}
                thumbnailUrl={franchise.thumbnailUrl}
                className={isFiltered ? 'w-full' : undefined}
              />
            ))}

            {!isFiltered && onVerMais && (
              <div className="flex items-center justify-center">
                <button
                  onClick={onVerMais}
                  className="flex-shrink-0 w-30 h-30 flex flex-col items-center justify-center aspect-squar rounded-xl
                  border-2 border-border hover:border-[#E25F3E] hover:text-[#E25F3E]
                  transition-colors text-sm font-medium text-[#171726] gap-2 cursor-pointer"
                >
                  <span className="text-2xl">→</span>
                  Ver mais
                </button>
              </div>
            )}
          </div>

          {isFiltered && (
            <Pagination
              page={page}
              total={total}
              limit={limit}
              onPageChange={handlePageChange}
              scrollToId={`category-${category}`}
              scrollMarginTop={96}
            />
          )}
        </>
      )}
    </div>
  )
}

export default FranchisesByCategory
