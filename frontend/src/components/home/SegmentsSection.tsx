'use client'

import RoundedButton from '@/src/components/ui/RoundedButton'
import { useState } from 'react'
import FranchisesByCategory from './FranchisesByCategory'
import type { HeroSearchFilters } from './hero-search/HeroSearch'

interface CategoryConfig {
  label: string
  segment?: string
  subsegment?: string
  excludeSubsegment?: string
}

const initialCategories: CategoryConfig[] = [
  {
    label: 'Alimentação - Mercados e Distribuição',
    segment: 'Alimentação',
    subsegment: 'Mercados e Distribuição',
  },
  {
    label: 'Entretenimento e Lazer',
    segment: 'Entretenimento e Lazer',
  },
  {
    label: 'Limpeza e Conservação',
    segment: 'Limpeza e Conservação',
  },
  {
    label: 'Saúde, Beleza e Bem Estar',
    segment: 'Saúde, Beleza e Bem Estar',
  },
  {
    label: 'Serviços Automotivos',
    segment: 'Serviços Automotivos',
  },
  {
    label: 'Alimentação - Food Service',
    segment: 'Alimentação',
    excludeSubsegment: 'Mercados e Distribuição',
  },
]

const additionalCategories: CategoryConfig[] = [
  {
    label: 'Hotelaria e Turismo',
    segment: 'Hotelaria e Turismo',
  },
  {
    label: 'Comunicação, Informática e Eletrônicos',
    segment: 'Comunicação, Informática e Eletrônicos',
  },
  {
    label: 'Moda',
    segment: 'Moda',
  },
  {
    label: 'Casa e Construção',
    segment: 'Casa e Construção',
  },
  {
    label: 'Serviços e Outros Negócios',
    segment: 'Serviços e Outros Negócios',
  },
  {
    label: 'Educação',
    segment: 'Educação',
  },
]

const allCategories: CategoryConfig[] = [
  ...initialCategories,
  ...additionalCategories,
]

interface SegmentsSectionProps {
  filters?: HeroSearchFilters | null
  onReset?: () => void
  onSegmentFilter?: (segment: string) => void
}

const SegmentsSection = ({
  filters,
  onReset,
  onSegmentFilter,
}: SegmentsSectionProps) => {
  const [showMore, setShowMore] = useState(false)

  const handleToggleMore = () => {
    setShowMore((prev) => !prev)
  }

  const SCROLL_OFFSET = 80

  const handleBackToSearch = () => {
    const el = document.getElementById('hero-search')
    if (el) {
      const top = Math.max(
        0,
        window.scrollY + el.getBoundingClientRect().top - SCROLL_OFFSET,
      )
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  const handleResetFilters = () => {
    onReset?.()
  }

  const minInvestment = filters ? String(filters.minInvestment) : undefined
  const maxInvestment = filters ? String(filters.maxInvestment) : undefined

  const filteredCategories = filters?.segment
    ? allCategories.filter((c) =>
        c.label.toLowerCase().includes(filters.segment.toLowerCase()),
      )
    : null

  return (
    <section
      id="segments-section"
      className="py-8 md:py-16 bg-[#FBFCFC] dark:bg-muted/40"
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-end gap-3 mb-6 md:mb-12">
          {filters && (
            <div className="flex items-center gap-3">
              <RoundedButton
                onClick={handleBackToSearch}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                borderColor="black"
                hoverBorderColor="#E25F3E"
                hoverTextColor="#E25F3E"
                text="↑ Filtro"
              />
              <RoundedButton
                text="Limpar filtros"
                type="button"
                onClick={handleResetFilters}
                color="#E25F3E"
                hoverColor="#E25F3E"
                textColor="white"
              />
            </div>
          )}
        </div>

        {filteredCategories !== null ? (
          filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <FranchisesByCategory
                key={category.label}
                category={category.label}
                segment={category.segment}
                subsegment={category.subsegment}
                excludeSubsegment={category.excludeSubsegment}
                minInvestment={minInvestment}
                maxInvestment={maxInvestment}
                isFiltered
              />
            ))
          ) : (
            <p className="text-muted-foreground">
              Nenhum segmento encontrado para &ldquo;{filters?.segment}&rdquo;.
            </p>
          )
        ) : (
          <>
            {initialCategories.map((category) => (
              <FranchisesByCategory
                key={category.label}
                category={category.label}
                segment={category.segment}
                subsegment={category.subsegment}
                excludeSubsegment={category.excludeSubsegment}
                minInvestment={minInvestment}
                maxInvestment={maxInvestment}
                onVerMais={() => onSegmentFilter?.(category.label)}
              />
            ))}

            {showMore && (
              <div className="transition-all duration-300">
                {additionalCategories.map((category) => (
                  <FranchisesByCategory
                    key={category.label}
                    category={category.label}
                    segment={category.segment}
                    subsegment={category.subsegment}
                    excludeSubsegment={category.excludeSubsegment}
                    minInvestment={minInvestment}
                    maxInvestment={maxInvestment}
                    onVerMais={() => onSegmentFilter?.(category.label)}
                  />
                ))}
              </div>
            )}

            <div className="flex justify-center mt-8">
              <button
                onClick={handleToggleMore}
                className="rounded-full border-2 border-border px-5 py-3 md:px-8 md:py-4 text-base md:text-lg font-medium text-[#171726] hover:border-[#E25F3E] hover:text-[#E25F3E] transition-colors cursor-pointer"
              >
                {showMore ? 'Ver menos segmentos' : 'Ver mais segmentos'}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default SegmentsSection
