'use client'
import { useEffect, useRef, useState } from 'react'
import DeleteIcon from '../icons/deleteIcon'
import FranchiseIcon from '../icons/franchiseIcon'
import SearchBar from './SearchBar'

interface Option {
  value: string
  label: string
}

interface MultiSelectProps {
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  error?: string
  className?: string
  maxSelected?: number
  searchPlaceholder?: string
}

export default function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = 'Selecione as opções',
  error,
  className = '',
  maxSelected,
  searchPlaceholder,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleToggleOption = (optionValue: string, maxSelected?: number) => {
    const isSelected = value.includes(optionValue)

    if (!isSelected && maxSelected && value.length >= maxSelected) {
      return
    }

    const newValue = isSelected
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue]

    onChange(newValue)
  }

  const handleRemoveOption = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue))
  }

  const selectedOptions = options.filter((option) =>
    value.includes(option.value),
  )

  // Filtrar opções baseado no termo de busca
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Focar no input de busca quando o dropdown abrir
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Limpar busca quando fechar o dropdown
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('')
    }
  }, [isOpen])

  return (
    <div className={`relative ${className}`}>
      {/* Container do campo principal com ícone */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
          <FranchiseIcon width={20} height={20} color="#747473" />
        </div>

        <div
          onClick={() => setIsOpen(!isOpen)}
          className="w-full min-h-[42px] px-3 py-2 pl-10 border border-[#747473] rounded-md focus-within:outline-none focus-within:ring-2 focus-within:ring-[#E25E3E] focus-within:border-[#E25E3E] cursor-pointer bg-white"
        >
          {selectedOptions.length === 0 ? (
            <span className="text-gray-500">{placeholder}</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {selectedOptions.map((option) => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-[#E4AC9E] text-black text-sm rounded-xs"
                >
                  {option.label}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveOption(option.value)
                    }}
                    className="hover:bg-black hover:bg-opacity-20 rounded-full p-0.5"
                  >
                    <DeleteIcon width={12} height={12} color="white" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-72">
          {/* Barra de busca */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <SearchBar
                searchInput={searchTerm}
                setSearchInput={setSearchTerm}
                setSearchTerm={setSearchTerm}
                setPage={() => {}}
                placeholder={searchPlaceholder || 'Buscar opções...'}
              />
            </div>
          </div>

          {/* Lista de opções filtradas */}
          <div className="max-h-48 overflow-y-auto pb-2">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-gray-500 text-sm">
                Nenhuma opção encontrada
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleToggleOption(option.value, maxSelected)}
                  className={`px-3 py-2 cursor-pointer hover:bg-[#E4AC9E]/20 ${
                    value.includes(option.value)
                      ? 'bg-[#E4AC9E]/20 text-[#E25E3E]'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{option.label}</span>
                    {value.includes(option.value) && (
                      <span className="text-[#E25E3E] font-medium">✓</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Overlay para fechar dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}

      {/* Error message */}
      {error && <div className="text-red-500">{error}</div>}
    </div>
  )
}
