'use client'

import { SEGMENTS } from '@/src/schemas/segments/segments'
import { useState } from 'react'
import SearchIcon from '../../icons/searchIcon'

const INPUT_LABEL_STYLE = { letterSpacing: '-1.5px' as const }
// py-2 (8px × 2) + text-sm line-height (20px)
const ITEM_HEIGHT = 36

export interface SegmentSectionProps {
  open: boolean
  onToggle: () => void
  onFocus: () => void
  selectedSegment: string
  onSearch: () => void
  isFocused: boolean
  isDimmed?: boolean
}

export function SegmentSection({
  open,
  onToggle,
  onFocus,
  selectedSegment,
  onSearch,
  isFocused,
  isDimmed = false,
}: SegmentSectionProps) {
  const triggerCta = 'Em qual segmento deseja investir?'

  return (
    <div
      className={`flex-1 relative transition-all duration-500 rounded-full ${
        isFocused ? 'duration-500' : ''
      }`}
    >
      <div
        className={`flex justify-between items-center pl-4 pr-1 md:pl-8 md:pr-2 py-3 md:py-2 cursor-pointer rounded-2xl md:rounded-full transition-colors duration-200 ${
          isDimmed ? 'hover:bg-gray-300' : ''
        }`}
        onClick={() => {
          onToggle()
          onFocus()
        }}
      >
        <div className="flex-1 min-w-0">
          <label
            className="block text-base md:text-xl font-normal text-gray-900"
            style={INPUT_LABEL_STYLE}
          >
            Segmento?
          </label>
          <input
            type="text"
            placeholder={triggerCta}
            value={selectedSegment}
            readOnly
            className="w-full text-base md:text-xl font-normal text-gray-600 placeholder:text-[#C9C9C9] bg-transparent outline-none cursor-pointer"
            style={INPUT_LABEL_STYLE}
          />
        </div>

        <div className="flex">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSearch()
            }}
            className={`flex-shrink-0 w-14 h-14 ${open ? 'transition-all duration-300 w-28' : ''} bg-black hover:bg-coral-dark rounded-full flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg group`}
            aria-label="Buscar"
          >
            <SearchIcon className="w-6 h-6 text-white" />
            {open ? <span className="text-white m-2">Buscar</span> : null}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Dropdown panel content (rendered by HeroSearch in the unified panel) ───

export interface SegmentDropdownPanelProps {
  onSegmentSelect: (segment: string) => void
}

export function SegmentDropdownPanel({
  onSegmentSelect,
}: SegmentDropdownPanelProps) {
  const [hoveredIndex, setHoveredIndex] = useState(-1)

  return (
    <div className="p-2 relative" onMouseLeave={() => setHoveredIndex(-1)}>
      {/* Sliding pill — same technique as the search bar pill */}
      <div
        className="absolute left-2 right-2 rounded-2xl bg-gray-100 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          top: `${8 + Math.max(0, hoveredIndex) * ITEM_HEIGHT}px`,
          height: `${ITEM_HEIGHT}px`,
          opacity: hoveredIndex >= 0 ? 1 : 0,
        }}
        aria-hidden
      />
      {SEGMENTS.map((segment, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSegmentSelect(segment)}
          onMouseEnter={() => setHoveredIndex(index)}
          className="relative z-10 w-full text-left px-4 py-2 rounded-2xl transition-colors duration-200 text-sm text-gray-700"
        >
          {segment}
        </button>
      ))}
    </div>
  )
}
