'use client'

import ArrowDownIcon from '@/src/components/icons/arrowDownIcon'
import ArrowUpIcon from '@/src/components/icons/arrowUpIcon'
import SearchIcon from '@/src/components/icons/searchIcon'
import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'

export type FranchisorFranchiseSelectOption = {
  value: string
  label: string
  logoUrl?: string | null
}

type Props = {
  value: string
  options: FranchisorFranchiseSelectOption[]
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function FranchisorFranchiseSelect({
  value,
  options,
  onChange,
  placeholder = 'Selecione uma franquia',
  className,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [alignRight, setAlignRight] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  )

  const filteredOptions = useMemo(() => {
    const t = searchTerm.trim().toLowerCase()
    if (!t) return options
    return options.filter((o) => o.label.toLowerCase().includes(t))
  }, [options, searchTerm])

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

  useEffect(() => {
    if (isOpen && searchInputRef.current) searchInputRef.current.focus()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) setSearchTerm('')
  }, [isOpen])

  const computeAlignment = () => {
    if (!dropdownRef.current) return
    const rect = dropdownRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    setAlignRight(rect.left + rect.width > viewportWidth - 16)
  }

  const handleToggle = () => {
    if (!isOpen) computeAlignment()
    setIsOpen((v) => !v)
  }

  const getInitial = (label?: string) =>
    (label?.trim()?.charAt(0) || 'F').toUpperCase()

  return (
    <div ref={dropdownRef} className={`relative ${className || ''}`}>
      <button
        type="button"
        onClick={handleToggle}
        className="
          flex items-center justify-between gap-3
          w-full md:w-auto
          rounded-full border border-input bg-white
          px-4 py-2
          text-sm font-medium
          hover:border-muted-foreground/40 hover:bg-secondary
          transition-colors
          focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary
        "
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-6 h-6 flex-shrink-0 overflow-hidden rounded-full">
            {selectedOption?.logoUrl ? (
              <Image
                src={selectedOption.logoUrl}
                alt={selectedOption.label}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  target.nextElementSibling?.classList.remove('hidden')
                }}
              />
            ) : null}
            <div
              className={`absolute inset-0 w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-semibold ${
                selectedOption?.logoUrl ? 'hidden' : ''
              }`}
            >
              {getInitial(selectedOption?.label)}
            </div>
          </div>

          <div className="flex flex-col items-start min-w-0">
            <span className="text-[11px] leading-none text-muted-foreground font-normal">
              Franquia
            </span>
            <span className="text-sm text-foreground truncate max-w-[60vw] md:max-w-[18vw]">
              {selectedOption?.label || placeholder}
            </span>
          </div>
        </div>

        {isOpen ? (
          <ArrowUpIcon
            width={14}
            height={14}
            color="hsl(var(--muted-foreground))"
          />
        ) : (
          <ArrowDownIcon
            width={14}
            height={14}
            color="hsl(var(--muted-foreground))"
          />
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 mt-2 w-full md:min-w-[320px] bg-white border border-input rounded-2xl shadow-lg overflow-hidden ${
            alignRight ? 'right-0' : 'left-0'
          }`}
          role="listbox"
        >
          <div className="p-2 border-b border-border/50">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon
                  width={16}
                  height={16}
                  color="hsl(var(--muted-foreground))"
                />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar franquia..."
                className="w-full pl-9 pr-3 py-2 text-sm text-[#171726] placeholder:text-[#6B7280] caret-[#171726] border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-center text-muted-foreground text-sm">
                Nenhuma franquia encontrada
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value)
                      setIsOpen(false)
                    }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors ${
                      isSelected ? 'bg-orange-50' : ''
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="relative w-7 h-7 flex-shrink-0 overflow-hidden rounded-full">
                      {opt.logoUrl ? (
                        <Image
                          src={opt.logoUrl}
                          alt={opt.label}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            target.nextElementSibling?.classList.remove(
                              'hidden',
                            )
                          }}
                        />
                      ) : null}
                      <div
                        className={`absolute inset-0 w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-semibold ${
                          opt.logoUrl ? 'hidden' : ''
                        }`}
                      >
                        {getInitial(opt.label)}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div
                        className={`text-sm truncate ${
                          isSelected
                            ? 'text-primary font-semibold'
                            : 'text-foreground'
                        }`}
                      >
                        {opt.label}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
