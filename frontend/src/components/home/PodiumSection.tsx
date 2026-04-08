'use client'

import { franchiseQueries } from '@/src/queries/franchises'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import AwardIcon from '../icons/awardIcon'
import MedalIcon from '../icons/medalIcon'
import StarIcon from '../icons/starIcon'
import TrophyIcon from '../icons/trophyIcon'

const PodiumSection = () => {
  const { data, isLoading } = useQuery(
    franchiseQueries.paginated({
      page: 1,
      limit: 10, // Fetch more to ensure we have 3 with reviews
      ratingSort: 'desc',
    }),
  )

  // Filter franchises with reviews and take top 3
  const franchisesWithReviews =
    data?.data?.filter(
      (f) => f.averageRating !== null && f.averageRating !== undefined,
    ) || []
  const topThree = franchisesWithReviews.slice(0, 3)

  // Transform to podium structure
  const podiumData = topThree.map((franchise, index) => {
    const position = index + 1
    let color = 'bg-gray-300'
    let heightClasses = 'h-20 sm:h-24 md:h-28' // #2 - medium height
    let medalColor = '#9ca3af'
    let MedalIconComponent = MedalIcon

    if (position === 1) {
      color = 'bg-yellow-400'
      heightClasses = 'h-28 sm:h-32 md:h-44' // #1 - tallest
      medalColor = '#eab308'
      MedalIconComponent = TrophyIcon
    } else if (position === 2) {
      color = 'bg-gray-300'
      heightClasses = 'h-20 sm:h-24 md:h-28' // #2 - medium height
      medalColor = '#9ca3af'
      MedalIconComponent = MedalIcon
    } else if (position === 3) {
      color = 'bg-amber-600'
      heightClasses = 'h-16 sm:h-20 md:h-24' // #3 - shortest
      medalColor = '#d97706'
      MedalIconComponent = AwardIcon
    }

    return {
      position,
      name: franchise.name,
      segment: franchise.segment || '',
      rating: franchise.averageRating || 0,
      logoUrl: franchise.logoUrl,
      color,
      heightClasses,
      medalColor,
      MedalIcon: MedalIconComponent,
      id: franchise.slug,
    }
  })

  // Reorder for visual display: 2nd, 1st, 3rd
  const orderedPodium = [
    podiumData.find((p) => p.position === 2),
    podiumData.find((p) => p.position === 1),
    podiumData.find((p) => p.position === 3),
  ].filter((item): item is NonNullable<typeof item> => item !== undefined)

  return (
    <section className="py-16 bg-gradient-to-b from-background to-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-primary mb-4">
            <TrophyIcon className="w-6 h-6" color="hsl(10 79% 57%)" />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Ranking 2024
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            🏆 Pódio das Campeãs
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            As franquias mais bem avaliadas do Brasil com base em avaliações
            reais de franqueados
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-end justify-center gap-2 sm:gap-4 md:gap-8 max-w-3xl mx-auto px-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex flex-col items-center flex-1 min-w-0 animate-pulse"
              >
                <div className="bg-card rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-border mb-2 sm:mb-4 w-full max-w-[110px] sm:max-w-[170px] md:max-w-[220px] h-56 sm:h-64 md:h-72"></div>
                <div className="w-full max-w-[120px] sm:max-w-[185px] md:max-w-[235px] h-20 sm:h-24 md:h-32 bg-gray-200 rounded-t-xl"></div>
              </div>
            ))}
          </div>
        ) : orderedPodium.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma franquia com avaliações encontrada
          </div>
        ) : (
          <div className="flex items-end justify-center gap-2 sm:gap-4 md:gap-8 max-w-3xl mx-auto px-2">
            {orderedPodium.map((item) => (
              <div
                key={item.position}
                className="flex flex-col items-center flex-1 min-w-0"
              >
                {/* Card */}
                <Link
                  href={`/ranking/${item.id}`}
                  className="w-full max-w-full"
                >
                  <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-border mb-2 sm:mb-4 w-full max-w-[110px] sm:max-w-[170px] md:max-w-[220px] mx-auto transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer">
                    {/* Medal */}
                    <div className="flex justify-center mb-2 sm:mb-3">
                      <item.MedalIcon
                        className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10"
                        color={item.medalColor}
                      />
                    </div>

                    {/* Logo */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 bg-secondary rounded-lg sm:rounded-xl flex items-center justify-center overflow-hidden">
                      {item.logoUrl ? (
                        <Image
                          src={item.logoUrl}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="object-contain w-full h-full"
                        />
                      ) : (
                        <span className="text-xl sm:text-2xl md:text-3xl">
                          🏢
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <h3 className="text-xs sm:text-sm md:text-lg font-bold text-foreground text-center mb-0.5 sm:mb-1 line-clamp-2">
                      {item.name}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground text-center mb-2 sm:mb-3 line-clamp-1">
                      {item.segment}
                    </p>

                    {/* Rating */}
                    <div className="flex items-center justify-center gap-0.5 mb-0.5 sm:mb-0">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="w-[9px] h-[9px] sm:w-[11px] sm:h-[11px] md:w-[14px] md:h-[14px] flex-shrink-0"
                        >
                          <StarIcon
                            width="100%"
                            height="100%"
                            color="#facc15"
                            filled={true}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-center text-xs sm:text-sm md:text-lg font-bold text-foreground mt-0.5 sm:mt-1">
                      {item.rating.toFixed(2)}
                    </p>
                  </div>
                </Link>

                {/* Podium Base */}
                <div
                  className={`w-full max-w-[120px] sm:max-w-[185px] md:max-w-[235px] mx-auto ${item.heightClasses} ${item.color} rounded-t-lg sm:rounded-t-xl flex items-center justify-center`}
                >
                  <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg">
                    #{item.position}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default PodiumSection
