'use client'

import Marquee from '@/src/components/ui/Marquee'
import { useRankingFilters } from '@/src/contexts/RankingContext'
import { Franchise } from '@/src/schemas/franchises/Franchise'
import { formatInvestmentRange } from '@/src/utils/formatters'
import Image from 'next/image'
import ArrowDownIcon from '../icons/arrowDownIcon'
import ArrowUpIcon from '../icons/arrowUpIcon'
import StarIcon from '../icons/starIcon'
import RankingMobileView from './RankingMobileView'

interface RankingTableViewProps {
  franchises: Franchise[]
  onClick: (franchiseSlug: string) => void
  id: string
}

const RankingTableView = ({
  franchises,
  onClick,
  id,
}: RankingTableViewProps) => {
  const { filters, toggleFilter } = useRankingFilters()

  const handleHeaderClick = (
    e: React.MouseEvent,
    sortCriterion:
      | 'isByDesc'
      | 'isByRatingAverage'
      | 'isByInvestment'
      | 'isByReturn',
  ) => {
    e.stopPropagation()
    toggleFilter(sortCriterion)
  }

  const getSortIcon = (sortValue: boolean | null): React.ReactNode | null => {
    if (sortValue === null) return null
    if (sortValue === true) {
      return (
        <ArrowUpIcon width={14} height={14} color="#E25E3E" className="ml-1" />
      )
    }
    return (
      <ArrowDownIcon width={14} height={14} color="#E25E3E" className="ml-1" />
    )
  }
  return (
    <div
      id={id}
      className="bg-card rounded-2xl border border-border overflow-hidden"
    >
      {/* Mobile View - Divs instead of table */}
      <RankingMobileView franchises={franchises} onClick={onClick} />

      {/* Desktop View - Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[12%] md:w-[6%]" />
            <col className="w-[44%] md:w-[26%]" />
            <col className="hidden md:table-column md:w-[19%]" />
            <col className="w-[44%] md:w-[15%]" />
            <col className="hidden md:table-column md:w-[17%]" />
            <col className="hidden md:table-column md:w-[17%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left p-2 md:p-4 font-semibold text-foreground">
                #
              </th>
              <th
                className="text-left p-2 md:p-4 font-semibold text-foreground cursor-pointer hover:bg-secondary/70 transition-colors select-none"
                onClick={(e) => handleHeaderClick(e, 'isByDesc')}
              >
                <div className="flex items-center">
                  Franquia
                  {getSortIcon(filters.isByDesc)}
                </div>
              </th>
              <th className="text-center p-4 font-semibold text-foreground hidden md:table-cell">
                Segmento
              </th>
              <th
                className="text-center p-2 md:p-4 font-semibold text-foreground cursor-pointer hover:bg-secondary/70 transition-colors select-none"
                onClick={(e) => handleHeaderClick(e, 'isByRatingAverage')}
              >
                <div className="flex items-center justify-center">
                  Avaliação
                  {getSortIcon(filters.isByRatingAverage)}
                </div>
              </th>
              <th
                className="text-center p-4 font-semibold text-foreground hidden md:table-cell cursor-pointer hover:bg-secondary/70 transition-colors select-none"
                onClick={(e) => handleHeaderClick(e, 'isByInvestment')}
              >
                <div className="flex items-center justify-center">
                  Unidades
                  {getSortIcon(filters.isByInvestment)}
                </div>
              </th>
              <th
                className="text-center p-4 font-semibold text-foreground hidden md:table-cell cursor-pointer hover:bg-secondary/70 transition-colors select-none"
                onClick={(e) => handleHeaderClick(e, 'isByReturn')}
              >
                <div className="flex items-center justify-center">
                  Investimento
                  {getSortIcon(filters.isByReturn)}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {franchises.map((franchise) => {
              const position = franchise.rankingPosition || 0
              return (
                <tr
                  key={franchise.id}
                  onClick={() => onClick(franchise.slug ?? franchise.id)}
                  className="border-b border-border last:border-0 transition-colors cursor-pointer hover:bg-secondary/30"
                >
                  <td
                    className="p-2 md:p-4 overflow-hidden"
                    style={{ maxWidth: 0 }}
                  >
                    <span className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm md:text-base text-[#626D84] bg-[#E8EAEE]">
                      {position}
                    </span>
                  </td>
                  <td
                    className="p-2 md:p-4 overflow-hidden md:overflow-hidden"
                    style={{ maxWidth: 0 }}
                  >
                    <div className="flex items-center gap-2 md:gap-3 min-w-0 w-full">
                      {franchise.logoUrl ? (
                        <Image
                          src={franchise.logoUrl}
                          alt={franchise.name}
                          width={32}
                          height={32}
                          className="object-contain rounded shrink-0 w-6 h-6 md:w-8 md:h-8"
                        />
                      ) : (
                        <span className="text-xl md:text-2xl shrink-0">🏢</span>
                      )}
                      <div className="flex items-center gap-1 md:gap-2 min-w-0 flex-1">
                        <Marquee className="flex-1 min-w-0">
                          <span className="font-medium text-foreground text-sm md:text-base">
                            {franchise.name}
                          </span>
                        </Marquee>
                      </div>
                    </div>
                  </td>
                  <td
                    className="p-4 text-center text-muted-foreground hidden md:table-cell min-w-0 overflow-hidden"
                    style={{ width: '19%', maxWidth: '19%' }}
                  >
                    <span className="truncate block">
                      {franchise.segment || 'Consulte'}
                    </span>
                  </td>
                  <td
                    className="p-2 md:p-4 text-center overflow-hidden"
                    style={{ maxWidth: 0 }}
                  >
                    <div className="flex items-center justify-center gap-0.5 min-w-0 overflow-hidden">
                      {Array.from({ length: 5 }).map((_, index) => {
                        const rating = franchise.averageRating || 0
                        const isFilled = index < Math.floor(rating)
                        return (
                          <StarIcon
                            key={index}
                            width={14}
                            height={14}
                            color={isFilled ? '#facc15' : '#d1d5db'}
                            filled={isFilled}
                            className="shrink-0"
                          />
                        )
                      })}
                      {franchise.averageRating !== null &&
                        franchise.averageRating !== undefined && (
                          <span className="font-semibold text-sm md:text-base whitespace-nowrap ml-1">
                            {franchise.averageRating.toFixed(1)}
                          </span>
                        )}
                    </div>
                  </td>
                  <td
                    className="p-4 text-center text-foreground hidden md:table-cell overflow-hidden"
                    style={{ width: '17%', maxWidth: '17%' }}
                  >
                    <span className="truncate block">
                      {franchise.totalUnits}
                    </span>
                  </td>
                  <td
                    className="p-4 text-center text-foreground hidden md:table-cell overflow-hidden"
                    style={{ width: '17%', maxWidth: '17%' }}
                  >
                    <span className="inline-block px-3 py-1 bg-primary/20 text-[#265973] rounded-full">
                      {formatInvestmentRange(
                        franchise.minimumInvestment,
                        franchise.maximumInvestment,
                      )}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RankingTableView
