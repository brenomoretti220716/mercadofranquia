'use client'

import CircleAlertIcon from '../icons/circleAlertIcon'
import MedalIcon from '../icons/medalIcon'
import TrendingUpIcon from '../icons/trendingUpIcon'
import type { RankingBigNumber } from '@/src/schemas/ranking/RankingBigNumber'
import FormSelect from '@/src/components/ui/FormSelect'

interface RankingSegmentCardsProps {
  segments: RankingBigNumber[]
  selectedYear?: number
  availableYears?: number[]
  onYearChange?: (year: number) => void
}

const RankingSegmentCards = ({
  segments,
  selectedYear,
  availableYears = [],
  onYearChange,
}: RankingSegmentCardsProps) => {
  const sortedSegments = [...segments].sort((a, b) => a.position - b.position)
  const shouldShowYearSelect =
    availableYears.length > 1 &&
    typeof selectedYear === 'number' &&
    availableYears.includes(selectedYear)

  const getBadge = (position: number) => {
    if (position === 1) return '#1 do Ano'
    if (position === 2) return '#2 do Ano'
    if (position === 3) return '#3 do Ano'
    return 'Pior do Ano'
  }

  const getIconColor = (position: number, isWorst: boolean) => {
    if (isWorst || position === 4) return '#EF4343'
    if (position === 1) return '#C39401'
    if (position === 2) return '#9CA3AF'
    return '#D97706'
  }

  const formatGrowth = (value: number | string) => {
    const numericValue =
      typeof value === 'number'
        ? value
        : Number(String(value).replace(',', '.'))

    if (Number.isNaN(numericValue)) {
      return '0,00%'
    }

    const sign = numericValue > 0 ? '+' : ''
    return `${sign}${numericValue.toFixed(2).replace('.', ',')}%`
  }

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        {/* Title Section */}
        <div className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-5xl font-bold mb-4">
              <span className="text-[#171726]">Ranking das Melhores </span>
              <span className="text-primary">Franquias do Brasil</span>
            </h1>
            <p className="text-[#6B7280] text-[20px]">
              Compare avaliações reais de franqueados, investimentos e retorno
              das principais marcas do mercado brasileiro.
            </p>
          </div>
          {shouldShowYearSelect && onYearChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Ano:
              </span>
              <div className="w-32 shrink-0">
                <FormSelect
                  name="rankingYear"
                  value={String(selectedYear)}
                  options={availableYears.map((year) => ({
                    value: String(year),
                    label: String(year),
                  }))}
                  onChange={(event) => onYearChange(Number(event.target.value))}
                  className="border-border"
                />
              </div>
            </div>
          )}
        </div>

        {/* Segment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {sortedSegments.map((segment) => (
            <div
              key={segment.id}
              className="bg-[#171726] rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Icon and Badge */}
              <div className="flex items-start justify-between mb-4">
                {segment.isWorst || segment.position === 4 ? (
                  <CircleAlertIcon
                    width={32}
                    height={32}
                    color={getIconColor(segment.position, segment.isWorst)}
                  />
                ) : (
                  <MedalIcon
                    width={32}
                    height={32}
                    color={getIconColor(segment.position, segment.isWorst)}
                  />
                )}
                <span
                  className={`text-sm font-medium px-3 py-1 rounded-full ${
                    segment.isWorst || segment.position === 4
                      ? 'bg-[#EF4343]/20'
                      : 'bg-[#22C55E]/20'
                  }`}
                  style={{
                    color:
                      segment.isWorst || segment.position === 4
                        ? '#EF4343'
                        : '#22C55E',
                  }}
                >
                  {getBadge(segment.position)}
                </span>
              </div>

              {/* Segment Name */}
              <h3 className="text-xl font-bold text-white mb-6">
                {segment.name}
              </h3>

              {/* Divider */}
              <div className="border-t border-white mb-4"></div>

              {/* Growth */}
              <div className="flex items-center gap-2">
                <TrendingUpIcon width={20} height={20} color={'#22C55E'} />
                <span
                  className="text-2xl font-bold"
                  style={{
                    color:
                      Number(segment.growthPercentage) < 0 || segment.isWorst
                        ? '#EF4343'
                        : '#22C55E',
                  }}
                >
                  {formatGrowth(segment.growthPercentage)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {sortedSegments.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
            Nenhum big number cadastrado para este ano.
          </div>
        )}
      </div>
    </section>
  )
}

export default RankingSegmentCards
