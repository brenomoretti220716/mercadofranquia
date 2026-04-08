'use client'

import FilterMenuInput from './FilterMenuInput'

interface FilterMenuRangeInputProps {
  label: string
  minValue: string
  maxValue: string
  onMinChange: (value: string) => void
  onMaxChange: (value: string) => void
  minPlaceholder?: string
  maxPlaceholder?: string
  formatValue?: (value: string) => string
  parseValue?: (value: string) => string
  type?: 'text' | 'number'
  className?: string
}

export default function FilterMenuRangeInput({
  label,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  minPlaceholder,
  maxPlaceholder,
  formatValue,
  parseValue,
  type = 'text',
  className = '',
}: FilterMenuRangeInputProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${className}`}>
      <FilterMenuInput
        label={`${label} - Mín`}
        value={minValue}
        onChange={onMinChange}
        type={type}
        placeholder={minPlaceholder}
        formatValue={formatValue}
        parseValue={parseValue}
      />
      <FilterMenuInput
        label={`${label} - Máx`}
        value={maxValue}
        onChange={onMaxChange}
        type={type}
        placeholder={maxPlaceholder}
        formatValue={formatValue}
        parseValue={parseValue}
      />
    </div>
  )
}
