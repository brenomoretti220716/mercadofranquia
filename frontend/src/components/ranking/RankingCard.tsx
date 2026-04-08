'use client'

import { Franchise } from '@/src/schemas/franchises/Franchise'
import { formatInvestmentRange, formatROIRange } from '@/src/utils/formatters'
import Image from 'next/image'
import ClockIcon from '../icons/clockIcon'
import DollarSignIcon from '../icons/dollarSignIcon'
import StarIcon from '../icons/starIcon'

interface RankingCardProps {
  franchise: Franchise
  position: number
  onClick: (franchiseSlug: string) => void
}

const RankingCard = ({ franchise, position, onClick }: RankingCardProps) => {
  return (
    <div
      onClick={() => onClick(franchise.slug ?? franchise.id)}
      className="rounded-2xl p-6 border-2 border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-primary/10">
          <span className="font-bold text-primary">#{position}</span>
        </div>
        <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
          {franchise.logoUrl ? (
            <Image
              src={franchise.logoUrl}
              alt={franchise.name}
              width={56}
              height={56}
              className="object-contain"
            />
          ) : (
            <span className="text-2xl">🏢</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground truncate">
                {franchise.name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {franchise.segment}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <StarIcon width={16} height={16} color="#facc15" filled={true} />
            <span className="font-semibold">
              {franchise.averageRating?.toFixed(1) || 'N/A'}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 space-y-2 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1">
            <DollarSignIcon width={16} height={16} color="#747473" />{' '}
            Investimento
          </span>
          <span className="font-medium text-foreground">
            {formatInvestmentRange(
              franchise.minimumInvestment,
              franchise.maximumInvestment,
            )}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1">
            <ClockIcon width={16} height={16} color="#747473" /> Retorno
          </span>
          <span className="font-medium text-foreground">
            {formatROIRange(
              franchise.minimumReturnOnInvestment,
              franchise.maximumReturnOnInvestment,
            )}
          </span>
        </div>
      </div>
    </div>
  )
}

export default RankingCard
