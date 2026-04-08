'use client'

import Header from '@/src/components/header/Header'
import QuizBanner from '@/src/components/home/QuizBanner'
import RankingDisplay from '@/src/components/ranking/RankingDisplay'
import RankingFilterMenu from '@/src/components/ranking/RankingFiltersMenu'
import RankingSegmentCards from '@/src/components/ranking/RankingSegmentCards'
import SegmentSponsoredSpotlight from '@/src/components/ranking/SegmentSponsoredSpotlight'
import { useRankingBigNumbers } from '@/src/hooks/ranking/useRankingBigNumbers'
import {
  sortDirectionToApi,
  useRankingFilters,
} from '@/src/contexts/RankingContext'
import { useRankingPaginated } from '@/src/hooks/franchises/useRanking'
import { getRankingSegmentFilterParams } from '@/src/utils/rankingSegmentFilters'
import { useRouter, useSearchParams } from 'next/navigation'
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs'
import { useEffect, useRef, useState } from 'react'

/** Offset below fixed header when scrolling to an anchor */
const SCROLL_ANCHOR_OFFSET = 80

export default function RankingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const didHeroScrollRef = useRef(false)
  const currentYear = new Date().getFullYear()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [searchInput] = useQueryState('search', parseAsString.withDefault(''))
  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions({ history: 'push' }),
  )

  const {
    isByDesc,
    isByRatingAverage,
    isByUnits,
    isByInvestment,
    isByReturn,
    isByFranchiseFee,
    isByaverageMonthlyRevenue,
    valueFilters,
    hasActiveFilters,
    buildUrl,
  } = useRankingFilters()
  const segmentFilters = getRankingSegmentFilterParams(valueFilters.segment)

  // Smooth scroll to quiz banner when arriving from hero search (scrollToRanking=1)
  useEffect(() => {
    if (didHeroScrollRef.current) return
    if (searchParams.get('scrollToRanking') !== '1') return
    didHeroScrollRef.current = true

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById('quiz-banner')
        if (!el) return
        const top = Math.max(
          0,
          window.scrollY +
            el.getBoundingClientRect().top -
            SCROLL_ANCHOR_OFFSET,
        )
        window.scrollTo({ top, behavior: 'smooth' })
      })
    })

    const params = new URLSearchParams(searchParams.toString())
    params.delete('scrollToRanking')
    const qs = params.toString()
    router.replace(qs ? `/ranking?${qs}` : '/ranking', { scroll: false })
  }, [searchParams, router])

  // Reset page to 1 when filters change
  useEffect(() => {
    if (page !== 1) {
      setPage(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    valueFilters.minInvestment,
    valueFilters.maxInvestment,
    valueFilters.minROI,
    valueFilters.maxROI,
    valueFilters.minFranchiseFee,
    valueFilters.maxFranchiseFee,
    valueFilters.minRevenue,
    valueFilters.maxRevenue,
    valueFilters.minUnits,
    valueFilters.maxUnits,
    valueFilters.rating,
    valueFilters.minRating,
    valueFilters.maxRating,
    valueFilters.segment,
    isByDesc,
    isByRatingAverage,
    isByUnits,
    isByInvestment,
    isByReturn,
    isByFranchiseFee,
    isByaverageMonthlyRevenue,
  ])

  const { franchises, total, lastPage, isLoading, isFetching } =
    useRankingPaginated({
      page,
      limit: 12,
      search: searchInput || undefined,
      nameSort: sortDirectionToApi(isByDesc),
      ratingSort: sortDirectionToApi(isByRatingAverage),
      unitsSort: sortDirectionToApi(isByUnits),
      investmentSort: sortDirectionToApi(isByInvestment),
      roiSort: sortDirectionToApi(isByReturn),
      franchiseFeeSort: sortDirectionToApi(isByFranchiseFee),
      revenueSort: sortDirectionToApi(isByaverageMonthlyRevenue),
      minInvestment: valueFilters.minInvestment || undefined,
      maxInvestment: valueFilters.maxInvestment || undefined,
      minROI: valueFilters.minROI || undefined,
      maxROI: valueFilters.maxROI || undefined,
      minFranchiseFee: valueFilters.minFranchiseFee || undefined,
      maxFranchiseFee: valueFilters.maxFranchiseFee || undefined,
      minRevenue: valueFilters.minRevenue || undefined,
      maxRevenue: valueFilters.maxRevenue || undefined,
      minUnits: valueFilters.minUnits || undefined,
      maxUnits: valueFilters.maxUnits || undefined,
      rating: valueFilters.rating ?? undefined,
      minRating: valueFilters.minRating ?? undefined,
      maxRating: valueFilters.maxRating ?? undefined,
      segment: segmentFilters.segment,
      subsegment: segmentFilters.subsegment,
      excludeSubsegment: segmentFilters.excludeSubsegment,
    })
  const { cards: rankingCards, years: availableYears } =
    useRankingBigNumbers(selectedYear)

  const handleFranchiseClick = (franchiseSlug: string) => {
    // Preserve filter state in URL when navigating to franchise detail
    router.push(buildUrl(`/ranking/${franchiseSlug}`))
  }

  return (
    <>
      <Header />

      <div className="min-h-screen bg-background">
        <RankingSegmentCards
          segments={rankingCards}
          selectedYear={selectedYear}
          availableYears={availableYears}
          onYearChange={setSelectedYear}
        />

        <QuizBanner />

        <div id="ranking" className="container px-4 py-8 relative mt-8">
          <RankingDisplay
            franchises={franchises}
            isLoading={isLoading}
            isFetching={isFetching}
            page={page}
            lastPage={lastPage}
            total={total}
            onPageChange={setPage}
            onFranchiseClick={handleFranchiseClick}
            title="Ranking"
            subtitle="Todas as franquias avaliadas, ordenadas por nota"
            showPagination={true}
            showViewToggle={true}
            defaultViewMode="table"
            onAdvancedFiltersClick={() => setIsSidebarOpen((v) => !v)}
            hasActiveFilters={hasActiveFilters}
            isFiltersOpen={isSidebarOpen}
            filtersContent={
              <RankingFilterMenu
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                embedded
              />
            }
            contentBetweenFiltersAndList={
              valueFilters.segment ? (
                <SegmentSponsoredSpotlight
                  segment={segmentFilters.segment ?? valueFilters.segment}
                  subsegment={segmentFilters.subsegment}
                  excludeSubsegment={segmentFilters.excludeSubsegment}
                  placement="RANKING_CATEGORIA"
                  title="Destaques do Segmento"
                />
              ) : null
            }
          />
        </div>
      </div>
    </>
  )
}
