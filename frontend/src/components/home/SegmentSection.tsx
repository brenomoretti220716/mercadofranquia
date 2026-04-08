'use client'

import { SEGMENTS } from '@/src/schemas/segments/segments'
import SearchIcon from '../icons/searchIcon'

const DROPDOWN_STYLES = {
  zIndex: 9999,
  animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
} as const

const INPUT_LABEL_STYLE = { letterSpacing: '-1.5px' as const }

export interface SegmentSectionProps {
  open: boolean
  onToggle: () => void
  onFocus: () => void
  selectedSegment: string
  onSegmentSelect: (segment: string) => void
  onSearch: () => void
  isFocused: boolean
}

export function SegmentSection({
  open,
  onToggle,
  onFocus,
  selectedSegment,
  onSegmentSelect,
  onSearch,
  isFocused,
}: SegmentSectionProps) {
  return (
    <div
      className={`flex-1 relative transition-all duration-300 rounded-full ${
        isFocused ? 'duration-500' : ''
      }`}
    >
      <div
        className="flex justify-between items-center pl-8 pr-4 py-2 cursor-pointer rounded-full hover:bg-gray-200"
        onClick={() => {
          onToggle()
          onFocus()
        }}
      >
        <div>
          <label
            className="block text-xl font-normal text-gray-900"
            style={INPUT_LABEL_STYLE}
          >
            Segmento?
          </label>
          <input
            type="text"
            placeholder="Alimentação, saúde e bem estar..."
            value={selectedSegment}
            readOnly
            className="w-full text-xl font-normal text-gray-600 placeholder:text-[#C9C9C9] bg-transparent outline-none cursor-pointer"
            style={INPUT_LABEL_STYLE}
          />
        </div>

        <div className="flex">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSearch()
            }}
            className={`w-14 h-14 ${open ? 'transition-all duration-200 w-28' : ''} bg-primary hover:bg-coral-dark rounded-full flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg group`}
            aria-label="Buscar"
          >
            <SearchIcon className="w-6 h-6 text-white" />
            {open ? <span className="text-white m-2">Buscar</span> : null}
          </button>
        </div>
      </div>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 max-h-96 overflow-y-auto origin-top"
          style={DROPDOWN_STYLES}
        >
          <div className="p-2">
            {SEGMENTS.map((segment, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onSegmentSelect(segment)}
                className="w-full text-left px-4 py-2 rounded-2xl hover:bg-gray-50 transition-colors duration-150 text-sm text-gray-700"
              >
                {segment}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
