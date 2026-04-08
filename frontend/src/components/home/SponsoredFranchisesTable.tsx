'use client'

import Marquee from '@/src/components/ui/Marquee'
import { Franchise } from '@/src/schemas/franchises/Franchise'
import { formatInvestmentRange } from '@/src/utils/formatters'
import Image from 'next/image'
import Link from 'next/link'
import ArrowRightIcon from '../icons/arrowRightIcon'
import StarIcon from '../icons/starIcon'

interface SponsoredFranchisesTableProps {
  franchises: Franchise[]
  onClick: (franchiseId: string) => void
}

export const sponsoredBadgeClassName =
  'inline-flex shrink-0 items-center gap-1 whitespace-nowrap px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-400/20 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300'

const SponsoredFranchisesTable = ({
  franchises,
  onClick,
}: SponsoredFranchisesTableProps) => {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Mobile View - Divs instead of table */}
      <div className="w-full md:hidden">
        {/* Header */}
        <div className="flex items-center border-b border-border bg-secondary/50">
          <div className="w-[15%] p-2 text-center font-semibold text-foreground text-sm">
            #
          </div>
          <div className="w-[65%] p-2 font-semibold text-foreground text-sm">
            Franquia
          </div>
          <div className="w-[25%] p-2 text-left font-semibold text-foreground text-sm">
            Avaliação
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border">
          {franchises.map((franchise) => {
            if (!franchise.slug) return null
            const position = franchise.rankingPosition || 0

            // Only render rows for franchises that have a slug available
            if (!franchise.slug) return null

            return (
              <div
                key={franchise.id}
                onClick={() => onClick(franchise.slug as string)}
                className="flex items-center cursor-pointer transition-colors hover:bg-secondary/30"
              >
                {/* Ranking Number */}
                <div className="w-[15%] p-2 text-center">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-[#626D84] bg-[#E8EAEE]">
                    {position}
                  </span>
                </div>

                {/* Franchise name: logo + marquee + badge on one row (like ranking + label) */}
                <div className="w-[65%] p-2 overflow-hidden min-w-0">
                  <div className="flex items-center gap-2 min-w-0 w-full">
                    {franchise.logoUrl ? (
                      <Image
                        src={franchise.logoUrl}
                        alt={franchise.name}
                        width={24}
                        height={24}
                        className="object-contain rounded shrink-0"
                      />
                    ) : (
                      <span className="text-xl shrink-0">🏢</span>
                    )}
                    <div className="flex min-w-0 flex-1 items-center overflow-hidden">
                      <div className="min-w-0 flex-1 overflow-hidden w-0">
                        <Marquee className="min-w-0 flex-1" forceAnimation>
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            <span className="font-medium text-foreground text-sm">
                              {franchise.name}
                            </span>
                            <span className={sponsoredBadgeClassName}>
                              ⭐ Patrocinado
                            </span>
                          </span>
                        </Marquee>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="w-[25%] p-2">
                  <div className="flex items-center gap-1">
                    <StarIcon
                      width={20}
                      height={20}
                      color="#facc15"
                      filled={true}
                    />
                    <span className="font-semibold text-sm">
                      {franchise.averageRating?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[10%]" />
            <col className="w-[28%]" />
            <col className="w-[20%]" />
            <col className="w-[16%]" />
            <col className="w-[18%]" />
            <col className="w-[8%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left px-6 py-4 font-semibold text-foreground">
                #
              </th>
              <th className="text-left px-6 py-4 font-semibold text-foreground">
                Franquia
              </th>
              <th className="text-center px-6 py-4 font-semibold text-foreground">
                Rating
              </th>
              <th className="text-center px-6 py-4 font-semibold text-foreground">
                Unidades
              </th>
              <th className="text-center px-6 py-4 font-semibold text-foreground">
                Investimento
              </th>
              <th className="text-center px-6 py-4 font-semibold text-foreground">
                {/* No title for Ver column */}
              </th>
            </tr>
          </thead>
          <tbody>
            {franchises.map((franchise) => {
              if (!franchise.slug) return null
              const position = franchise.rankingPosition || 0
              // Only render rows for franchises that have a slug available
              if (!franchise.slug) return null

              return (
                <tr
                  key={franchise.id}
                  onClick={() => onClick(franchise.slug as string)}
                  className="border-b last:border-0 border-border hover:bg-secondary/30 transition-colors cursor-pointer"
                >
                  <td
                    className="px-6 py-4 overflow-hidden"
                    style={{ maxWidth: 0 }}
                  >
                    <span className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-[#626D84] bg-[#E8EAEE]">
                      {position}
                    </span>
                  </td>
                  <td
                    className="px-6 py-4 overflow-hidden"
                    style={{ maxWidth: 0 }}
                  >
                    <div className="flex items-center gap-3 min-w-0 w-full">
                      {franchise.logoUrl ? (
                        <Image
                          src={franchise.logoUrl}
                          alt={franchise.name}
                          width={32}
                          height={32}
                          className="object-contain rounded shrink-0 w-8 h-8"
                        />
                      ) : (
                        <span className="text-2xl shrink-0">🏢</span>
                      )}
                      <div className="flex min-w-0 flex-1 items-center overflow-hidden">
                        <div className="min-w-0 flex-1 overflow-hidden w-0">
                          <Marquee className="min-w-0 flex-1" forceAnimation>
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                              <span className="font-medium text-foreground text-base">
                                {franchise.name}
                              </span>
                              <span className={sponsoredBadgeClassName}>
                                ⭐ Patrocinado
                              </span>
                            </span>
                          </Marquee>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    className="px-6 py-4 text-center overflow-hidden"
                    style={{ maxWidth: 0 }}
                  >
                    <div className="flex items-center justify-center gap-0.5 min-w-0 overflow-hidden">
                      {Array.from({ length: 5 }).map((_, index) => {
                        const rating = franchise.averageRating || 0
                        const isFilled = index < Math.floor(rating)
                        return (
                          <StarIcon
                            key={index}
                            width={18}
                            height={18}
                            color={isFilled ? '#facc15' : '#d1d5db'}
                            filled={isFilled}
                            className="shrink-0"
                          />
                        )
                      })}
                      {franchise.averageRating !== null &&
                        franchise.averageRating !== undefined && (
                          <span className="font-semibold text-base whitespace-nowrap ml-1">
                            {franchise.averageRating.toFixed(1)}
                          </span>
                        )}
                    </div>
                  </td>
                  <td
                    className="px-6 py-4 text-center text-foreground overflow-hidden"
                    style={{ width: '16%', maxWidth: '16%' }}
                  >
                    <span className="truncate block">
                      {franchise.totalUnits}
                    </span>
                  </td>
                  <td
                    className="px-6 py-4 text-center text-foreground overflow-hidden"
                    style={{ width: '18%', maxWidth: '18%' }}
                  >
                    <span className="inline-block px-3 py-1 bg-primary/20 text-[#265973] rounded-full truncate max-w-full">
                      {formatInvestmentRange(
                        franchise.minimumInvestment,
                        franchise.maximumInvestment,
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link
                      href={`/ranking/${franchise.slug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                    >
                      <span>Ver</span>
                      <ArrowRightIcon width={18} height={18} />
                    </Link>
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

export default SponsoredFranchisesTable
