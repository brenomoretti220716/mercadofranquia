'use client'

import { usePlatformStatistics } from '@/src/hooks/statistics/usePlatformStatistics'
import { useCountUp } from '@/src/hooks/useCountUp'
import TrendingUpIcon from '../icons/trendingUpIcon'
import UsersIcon from '../icons/usersIcon'
import GridIcon from '../icons/gridIcon'
import StarIcon from '../icons/starIcon'

const formatNumber = (num: number): string => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  }
  return num.toLocaleString('pt-BR')
}

const formatMedian = (median: number | null): string => {
  if (median === null) return '-'
  return median.toFixed(1).replace('.', ',')
}

const HeroSection = () => {
  const { data: statistics, isLoading } = usePlatformStatistics()

  // Animated values
  const animatedFranchisesReviewed = useCountUp(
    statistics?.franchisesReviewed ?? null,
    { duration: 2000 },
  )
  const animatedTotalReviews = useCountUp(statistics?.totalReviews ?? null, {
    duration: 2000,
  })
  const animatedTotalSegments = useCountUp(statistics?.totalSegments ?? null, {
    duration: 2000,
  })
  const animatedMedianRating = useCountUp(statistics?.medianRating ?? null, {
    duration: 2000,
    decimals: 1,
  })

  const stats = [
    {
      icon: TrendingUpIcon,
      value: isLoading ? '...' : formatNumber(animatedFranchisesReviewed),
      label: 'Franquias Avaliadas',
    },
    {
      icon: UsersIcon,
      value: isLoading ? '...' : formatNumber(animatedTotalReviews),
      label: 'Avaliações de Franqueados',
    },
    {
      icon: GridIcon,
      value: isLoading ? '...' : formatNumber(animatedTotalSegments),
      label: 'Segmentos Mapeados',
    },
    {
      icon: StarIcon,
      value: isLoading
        ? '...'
        : statistics?.medianRating === null
          ? '-'
          : formatMedian(animatedMedianRating),
      label: 'Nota Média Geral',
    },
  ]

  return (
    <section className="relative bg-gradient-to-br from-navy via-navy to-dark-bg py-20 md:py-28 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Ranking das Melhores{' '}
            <span className="text-primary">Franquias do Brasil</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
            Compare avaliações reais de franqueados, investimentos e retorno das
            principais marcas do mercado brasileiro.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center transition-all duration-300 hover:bg-white/15 hover:-translate-y-1"
            >
              <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-white/60">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HeroSection
