'use client'

import { useRankingFilters } from '@/src/contexts/RankingContext'
import { useRankingPaginated } from '@/src/hooks/franchises/useRanking'
import { getRankingSegmentFilterParams } from '@/src/utils/rankingSegmentFilters'
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs'
import { useRouter } from 'next/navigation'
import RankingDisplay from '../ranking/RankingDisplay'

const RankingSection = () => {
  const router = useRouter()
  const [search] = useQueryState('search', parseAsString.withDefault(''))
  const [page, setPage] = useQueryState(
    'rankingPage',
    parseAsInteger.withDefault(1).withOptions({ history: 'push' }),
  )
  const { valueFilters } = useRankingFilters()
  const segmentFilters = getRankingSegmentFilterParams(valueFilters.segment)

  const { franchises, lastPage, total, isLoading } = useRankingPaginated({
    page,
    limit: 12,
    search: search || undefined,
    segment: segmentFilters.segment,
    subsegment: segmentFilters.subsegment,
    excludeSubsegment: segmentFilters.excludeSubsegment,
    // No explicit sort - uses backend default (totalUnits desc, then name asc)
    // This matches the ranking page default behavior
  })

  const handleFranchiseClick = (franchiseSlug: string) => {
    router.push(`/ranking/${franchiseSlug}`)
  }

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <RankingDisplay
          franchises={franchises}
          isLoading={isLoading}
          page={page}
          lastPage={lastPage}
          total={total}
          onPageChange={setPage}
          onFranchiseClick={handleFranchiseClick}
          title="📊 Ranking Completo"
          subtitle="Todas as franquias avaliadas, ordenadas por nota"
          showPagination={true}
          showViewToggle={true}
        />
      </div>
    </section>
  )
}

export default RankingSection
