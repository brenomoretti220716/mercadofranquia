'use client'

import ArrowDownIcon from '@/src/components/icons/arrowDownIcon'
import ArrowUpIcon from '@/src/components/icons/arrowUpIcon'
import SearchIcon from '@/src/components/icons/searchIcon'
import { useEffect, useRef, useState } from 'react'

export interface FilterOption {
  value: string
  label: string
}

interface FilterMenuSelectWithSearchProps {
  label: string
  value: string | null
  options: FilterOption[]
  onChange: (value: string | null) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
}

export default function FilterMenuSelectWithSearch({
  label,
  value,
  options,
  onChange,
  placeholder = 'Selecione...',
  searchPlaceholder = 'Buscar...',
  className = '',
}: FilterMenuSelectWithSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [alignRight, setAlignRight] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)
  const displayText = selectedOption?.label || placeholder

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Clear search when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('')
    }
  }, [isOpen])

  const handleToggle = () => {
    if (!isOpen && dropdownRef.current) {
      const dropdownRect = dropdownRef.current.getBoundingClientRect()
      const buttonWidth = dropdownRect.width
      const viewportWidth = window.innerWidth

      // Check if modal would overflow on the right (with some padding)
      const wouldOverflow = dropdownRect.left + buttonWidth > viewportWidth - 16
      setAlignRight(wouldOverflow)
    }
    setIsOpen(!isOpen)
  }

  const handleSelect = (optionValue: string) => {
    onChange(optionValue === value ? null : optionValue)
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange(null)
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        className={`
          flex items-center justify-between gap-2 
          px-4 py-2 
          bg-white border border-gray-300 rounded-lg
          hover:border-gray-400 hover:bg-gray-50
          transition-colors
          w-full
          ${className.includes('min-w-0') ? 'min-w-0' : 'min-w-[40vw] md:min-w-[10vw]'}
          ${value ? 'border-[#E25E3E] bg-orange-50' : ''}
        `}
      >
        <div className="flex flex-col items-start">
          <span className="text-xs text-gray-500 font-medium">{label}</span>
          <span
            className={`text-sm ${value ? 'text-[#E25E3E] font-semibold' : 'text-gray-700'}`}
          >
            {displayText}
          </span>
        </div>
        {isOpen ? (
          <ArrowUpIcon
            width={12}
            height={12}
            color={value ? '#E25E3E' : '#6B7280'}
          />
        ) : (
          <ArrowDownIcon
            width={12}
            height={12}
            color={value ? '#E25E3E' : '#6B7280'}
          />
        )}
      </button>

      {isOpen && (
        <div
          ref={modalRef}
          className={`absolute z-50 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-72 ${
            alignRight ? 'right-0' : 'left-0'
          }`}
        >
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon width={16} height={16} color="#9CA3AF" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E25E3E] focus:border-[#E25E3E]"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto pb-2">
            {/* Clear option */}
            <div
              onClick={handleClear}
              className={`
                px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors
                ${!value ? 'bg-gray-100 font-semibold' : ''}
              `}
            >
              <span className="text-sm text-gray-700">{placeholder}</span>
            </div>

            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-center text-gray-500 text-sm">
                Nenhuma opção encontrada
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`
                    px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors
                    ${value === option.value ? 'bg-orange-50 text-[#E25E3E] font-semibold' : 'text-gray-700'}
                  `}
                >
                  <span className="text-sm">{option.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
