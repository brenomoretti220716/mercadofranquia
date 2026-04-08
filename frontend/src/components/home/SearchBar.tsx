'use client'

import { useRankingFilters } from '@/src/contexts/RankingContext'
import { parseAsString, useQueryState } from 'nuqs'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import FilterIcon from '../icons/filterDeleteIcon'
import SearchIcon from '../icons/searchIcon'

// Popular segments to show as chips (can be expanded)
const POPULAR_SEGMENTS = [
  { value: '', label: 'Todos' },
  { value: 'Alimentação', label: 'Alimentação' },
  { value: 'Saúde', label: 'Saúde' },
  { value: 'Beleza', label: 'Beleza' },
  { value: 'Serviços e Outros Negócios', label: 'Serviços' },
  { value: 'Educação', label: 'Educação' },
]

export interface SearchBarProps {
  showAdvancedFilters?: boolean
  onAdvancedFiltersClick?: () => void
  hasActiveFilters?: boolean
  isFiltersOpen?: boolean
  filtersContent?: ReactNode
}

const SearchBar = ({
  showAdvancedFilters = false,
  onAdvancedFiltersClick,
  hasActiveFilters = false,
  isFiltersOpen = false,
  filtersContent,
}: SearchBarProps = {}) => {
  const [searchInput, setSearchInput] = useQueryState(
    'search',
    parseAsString.withDefault(''),
  )
  const [searchTerm, setSearchTerm] = useState(searchInput)
  const { valueFilters, setValueFilter } = useRankingFilters()
  const activeSegment = valueFilters.segment || ''

  // Sync local search term with URL state
  useEffect(() => {
    setSearchTerm(searchInput)
  }, [searchInput])

  const handleSearch = () => {
    setSearchInput(searchTerm)
  }

  const handleSegmentClick = (segmentValue: string) => {
    // "Todos" maps to empty string to clear filter
    setValueFilter('segment', segmentValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <section className="relative z-20 pb-8">
      <div className="w-full">
        <div className="bg-card rounded-3xl shadow-big p-6 md:p-8 border border-border">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <SearchIcon
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
                color="#747473"
              />
              <input
                type="text"
                placeholder="Buscar franquias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-12 h-14 text-base rounded-xl border border-border bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Segment Filters */}
            <div className="flex gap-2 flex-wrap">
              {POPULAR_SEGMENTS.map((segment) => {
                const isActive = activeSegment === segment.value
                return (
                  <button
                    key={segment.value || 'todos'}
                    onClick={() => handleSegmentClick(segment.value)}
                    className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                    }`}
                  >
                    {segment.label}
                  </button>
                )
              })}
            </div>

            {/* Advanced Filters Button (optional) */}
            {showAdvancedFilters && onAdvancedFiltersClick && (
              <button
                type="button"
                id="filters-toggle-button"
                onClick={(e) => {
                  e.stopPropagation()
                  onAdvancedFiltersClick()
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  hasActiveFilters
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                }`}
                aria-label="Mais"
              >
                <FilterIcon
                  width={20}
                  height={20}
                  color={hasActiveFilters ? 'currentColor' : '#6B7280'}
                />
                <span className="text-sm font-medium">Mais</span>
              </button>
            )}

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="bg-primary hover:bg-coral-dark text-primary-foreground rounded-xl h-14 px-8 font-semibold flex items-center justify-center transition-colors"
            >
              <SearchIcon className="w-5 h-5 mr-2" color="white" />
              Buscar
            </button>
          </div>

          {/* Filters accordion inside the same container */}
          {showAdvancedFilters && isFiltersOpen && filtersContent && (
            <div
              className="pt-3 mt-2 border-t border-border"
              id="filters-container"
            >
              {filtersContent}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default SearchBar
