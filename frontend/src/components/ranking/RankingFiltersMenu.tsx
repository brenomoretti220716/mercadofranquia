'use client'

import FilterDeleteIcon from '@/src/components/icons/filterDeleteIcon'
import StarIcon from '@/src/components/icons/starIcon'
import FilterMenuRangeInput from '@/src/components/ui/FilterMenu/FilterMenuRangeInput'
import FilterMenuSelectWithSearch from '@/src/components/ui/FilterMenu/FilterMenuSelectWithSearch'
import { useRankingFilters } from '@/src/contexts/RankingContext'
import { useEffect, useRef, useState } from 'react'

const formatCurrencyInput = (value: string) => {
  // Remove all non-numeric characters
  const numericValue = value.replace(/\D/g, '')
  if (!numericValue) return ''

  // Format as currency
  const num = parseFloat(numericValue)
  if (isNaN(num)) return ''

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

const parseCurrencyValue = (value: string) => {
  // Remove all non-numeric characters to get the raw number
  return value.replace(/\D/g, '')
}

const STANDARD_SEGMENTS = [
  { segment: 'Alimentação - Mercados e Distribuição' },
  { segment: 'Alimentação - Food Service' },
  { segment: 'Casa e Construção' },
  { segment: 'Comunicação, Informática e Eletrônicos' },
  { segment: 'Educação' },
  { segment: 'Entretenimento e Lazer' },
  { segment: 'Hotelaria e Turismo' },
  { segment: 'Limpeza e Conservação' },
  { segment: 'Moda' },
  { segment: 'Saúde, Beleza e Bem Estar' },
  { segment: 'Serviços Automotivos' },
  { segment: 'Serviços e Outros Negócios' },
] as const

const SEGMENT_OPTIONS = STANDARD_SEGMENTS.map((item) => ({
  value: item.segment,
  label: item.segment,
}))

interface RankingFilterMenuProps {
  isOpen: boolean
  onClose: () => void
  /** When true, renders with minimal chrome for use inside another container (e.g. SearchBar) */
  embedded?: boolean
}

export default function RankingFilterMenu({
  isOpen,
  onClose,
  embedded = false,
}: RankingFilterMenuProps) {
  const { valueFilters, setValueFilter, resetAllStates } = useRankingFilters()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [hoveredMinStar, setHoveredMinStar] = useState<number | null>(null)
  const [hoveredMaxStar, setHoveredMaxStar] = useState<number | null>(null)
  const [draftSegment, setDraftSegment] = useState(valueFilters.segment || '')
  const selectedSegmentOptionValue = draftSegment || null

  useEffect(() => {
    if (isOpen) {
      setDraftSegment(valueFilters.segment || '')
    }
  }, [isOpen, valueFilters.segment])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const filtersButton = document.getElementById('filters-toggle-button')
      const filtersContainer = document.getElementById('filters-container')

      // Don't close if clicking on the filters button or its container
      if (
        filtersButton?.contains(target) ||
        filtersContainer?.contains(target)
      ) {
        return
      }

      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(target) &&
        isOpen
      ) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={sidebarRef}
      className={
        embedded
          ? 'w-full rounded-xl bg-secondary/30 border border-border'
          : 'w-full bg-white border border-border rounded-xl shadow-lg mt-2'
      }
    >
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Segment */}
          <div>
            <FilterMenuSelectWithSearch
              label="Segmento"
              value={selectedSegmentOptionValue}
              options={SEGMENT_OPTIONS}
              onChange={(value) => setDraftSegment(value || '')}
              placeholder="Todos os segmentos"
              searchPlaceholder="Buscar segmento..."
              className="w-full"
            />
          </div>

          {/* Unidades */}
          <FilterMenuRangeInput
            label="Unidades"
            minValue={valueFilters.minUnits || ''}
            maxValue={valueFilters.maxUnits || ''}
            onMinChange={(value) => setValueFilter('minUnits', value || '')}
            onMaxChange={(value) => setValueFilter('maxUnits', value || '')}
            minPlaceholder="Ex: 10"
            maxPlaceholder="Ex: 100"
            type="number"
          />

          {/* Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Mínima */}
            <div
              className={`
                relative
                flex flex-col items-start justify-center
                px-4 py-2
                bg-white border border-gray-300 rounded-lg
                hover:border-gray-400 hover:bg-gray-50
                transition-colors
                w-full
                min-h-[2.5rem]
                ${
                  valueFilters.minRating !== null &&
                  valueFilters.minRating !== undefined
                    ? 'border-[#E25E3E] bg-orange-50'
                    : ''
                }
              `}
            >
              {/* Label */}
              <span className="text-xs text-gray-500 font-medium mb-1">
                Avaliação - Mín
              </span>
              {/* Stars */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, index) => {
                  const starValue = index + 1
                  const isActive =
                    hoveredMinStar !== null
                      ? starValue <= hoveredMinStar
                      : valueFilters.minRating !== null &&
                        valueFilters.minRating !== undefined &&
                        starValue <= valueFilters.minRating

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        const newValue =
                          starValue === valueFilters.minRating
                            ? null
                            : starValue
                        setValueFilter('minRating', newValue)
                      }}
                      onMouseEnter={() => setHoveredMinStar(starValue)}
                      onMouseLeave={() => setHoveredMinStar(null)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <StarIcon
                        color={isActive ? '#E25E3E' : '#B4B4B4'}
                        filled={true}
                        width={20}
                        height={20}
                      />
                    </button>
                  )
                })}
                {valueFilters.minRating && (
                  <span className="ml-1 text-xs text-[#E25E3E] font-semibold">
                    {valueFilters.minRating}+
                  </span>
                )}
              </div>
            </div>

            {/* Máxima */}
            <div
              className={`
                relative
                flex flex-col items-start justify-center
                px-4 py-2
                bg-white border border-gray-300 rounded-lg
                hover:border-gray-400 hover:bg-gray-50
                transition-colors
                w-full
                min-h-[2.5rem]
                ${
                  valueFilters.maxRating !== null &&
                  valueFilters.maxRating !== undefined
                    ? 'border-[#E25E3E] bg-orange-50'
                    : ''
                }
              `}
            >
              {/* Label */}
              <span className="text-xs text-gray-500 font-medium mb-1">
                Avaliação - Máx
              </span>
              {/* Stars */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, index) => {
                  const starValue = index + 1
                  const isActive =
                    hoveredMaxStar !== null
                      ? starValue <= hoveredMaxStar
                      : valueFilters.maxRating !== null &&
                        valueFilters.maxRating !== undefined &&
                        starValue <= valueFilters.maxRating

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        const newValue =
                          starValue === valueFilters.maxRating
                            ? null
                            : starValue
                        setValueFilter('maxRating', newValue)
                      }}
                      onMouseEnter={() => setHoveredMaxStar(starValue)}
                      onMouseLeave={() => setHoveredMaxStar(null)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <StarIcon
                        color={isActive ? '#E25E3E' : '#B4B4B4'}
                        filled={true}
                        width={20}
                        height={20}
                      />
                    </button>
                  )
                })}
                {valueFilters.maxRating && (
                  <span className="ml-1 text-xs text-[#E25E3E] font-semibold">
                    {valueFilters.maxRating}+
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Investimento */}
          <FilterMenuRangeInput
            label="Investimento"
            minValue={valueFilters.minInvestment || ''}
            maxValue={valueFilters.maxInvestment || ''}
            onMinChange={(value) =>
              setValueFilter('minInvestment', value || '')
            }
            onMaxChange={(value) =>
              setValueFilter('maxInvestment', value || '')
            }
            minPlaceholder="Ex: 100.000"
            maxPlaceholder="Ex: 500.000"
            formatValue={formatCurrencyInput}
            parseValue={parseCurrencyValue}
          />

          {/* Receita Mensal */}
          <FilterMenuRangeInput
            label="Receita Mensal"
            minValue={valueFilters.minRevenue || ''}
            maxValue={valueFilters.maxRevenue || ''}
            onMinChange={(value) => setValueFilter('minRevenue', value || '')}
            onMaxChange={(value) => setValueFilter('maxRevenue', value || '')}
            minPlaceholder="Ex: 50.000"
            maxPlaceholder="Ex: 200.000"
            formatValue={formatCurrencyInput}
            parseValue={parseCurrencyValue}
          />

          {/* Retorno (ROI) */}
          <FilterMenuRangeInput
            label="Retorno (ROI)"
            minValue={valueFilters.minROI || ''}
            maxValue={valueFilters.maxROI || ''}
            onMinChange={(value) => setValueFilter('minROI', value || '')}
            onMaxChange={(value) => setValueFilter('maxROI', value || '')}
            minPlaceholder="Ex: 12"
            maxPlaceholder="Ex: 24"
            formatValue={formatCurrencyInput}
            parseValue={parseCurrencyValue}
          />

          {/* Taxa de Franquia */}
          <FilterMenuRangeInput
            label="Taxa de Franquia"
            minValue={valueFilters.minFranchiseFee || ''}
            maxValue={valueFilters.maxFranchiseFee || ''}
            onMinChange={(value) =>
              setValueFilter('minFranchiseFee', value || '')
            }
            onMaxChange={(value) =>
              setValueFilter('maxFranchiseFee', value || '')
            }
            minPlaceholder="Ex: 25.000"
            maxPlaceholder="Ex: 100.000"
            formatValue={formatCurrencyInput}
            parseValue={parseCurrencyValue}
          />

          {/* Action Buttons */}
          <div className="sm:col-span-2 lg:col-span-3 flex flex-col sm:flex-row gap-2 mt-2">
            <button
              type="button"
              onClick={() => {
                setDraftSegment('')
                resetAllStates()
                onClose()
              }}
              className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 border bg-white border-gray-300 hover:border-gray-400 rounded-md transition-colors text-sm font-medium text-gray-700"
              title="Limpar todos os filtros"
            >
              <FilterDeleteIcon width={16} height={16} color="#6B7280" />
              <span>Limpar filtros</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setValueFilter('segment', draftSegment)
                onClose()
              }}
              className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm"
              title="Aplicar filtros"
            >
              <span>Filtrar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
