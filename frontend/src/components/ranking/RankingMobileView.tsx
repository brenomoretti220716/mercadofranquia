'use client'

import Marquee from '@/src/components/ui/Marquee'
import { Franchise } from '@/src/schemas/franchises/Franchise'
import Image from 'next/image'
import StarIcon from '../icons/starIcon'

interface RankingMobileViewProps {
  franchises: Franchise[]
  onClick: (franchiseSlug: string) => void
}

export default function RankingMobileView({
  franchises,
  onClick,
}: RankingMobileViewProps) {
  return (
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
          const position = franchise.rankingPosition || 0

          return (
            <div
              key={franchise.id}
              onClick={() => onClick(franchise.slug ?? franchise.id)}
              className="flex items-center cursor-pointer transition-colors hover:bg-secondary/30"
            >
              {/* Ranking Number - 10% */}
              <div className="w-[15%] p-2 text-center">
                <span className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm md:text-base text-primary">
                  {position}
                </span>
              </div>

              {/* Franchise Name - 70% */}
              <div className="w-[65%] p-2 overflow-hidden">
                <div className="flex items-center gap-2 min-w-0">
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
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <Marquee>
                      <span className="font-medium text-foreground text-sm">
                        {franchise.name}
                      </span>
                    </Marquee>
                  </div>
                </div>
              </div>

              {/* Rating - 35% */}
              <div className="w-[25%] p-2">
                <div className="flex items-center gap-1">
                  <StarIcon
                    width={16}
                    height={16}
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
  )
}
