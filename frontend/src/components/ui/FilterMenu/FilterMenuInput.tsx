'use client'

import { forwardRef, useEffect, useRef, useState } from 'react'

interface FilterMenuInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'number'
  placeholder?: string
  formatValue?: (value: string) => string // for currency formatting display
  parseValue?: (value: string) => string // for parsing formatted values
  className?: string
  disabled?: boolean
}

const FilterMenuInput = forwardRef<HTMLInputElement, FilterMenuInputProps>(
  (
    {
      label,
      value,
      onChange,
      type = 'text',
      placeholder = '',
      formatValue,
      parseValue,
      className = '',
      disabled = false,
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const [isFocused, setIsFocused] = useState(false)
    const [displayValue, setDisplayValue] = useState('')

    // Combine refs
    useEffect(() => {
      if (ref) {
        if (typeof ref === 'function') {
          ref(inputRef.current)
        } else {
          ref.current = inputRef.current
        }
      }
    }, [ref])

    // Update display value when value changes
    useEffect(() => {
      if (value) {
        if (formatValue) {
          setDisplayValue(formatValue(value))
        } else {
          setDisplayValue(value)
        }
      } else {
        setDisplayValue('')
      }
    }, [value, formatValue])

    const hasValue = !!value
    const showPlaceholder = !hasValue && !isFocused && placeholder

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value

      if (parseValue) {
        const parsed = parseValue(rawValue)
        onChange(parsed)
      } else {
        onChange(rawValue)
      }
    }

    const handleFocus = () => {
      setIsFocused(true)
      // When focusing, show raw value if we're using formatting
      if (formatValue && value) {
        setDisplayValue(value)
      }
    }

    const handleBlur = () => {
      setIsFocused(false)
      // When blurring, format the value if formatter exists
      if (formatValue && value) {
        setDisplayValue(formatValue(value))
      }
    }

    return (
      <div className={`relative ${className}`}>
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
            ${hasValue ? 'border-[#E25E3E] bg-orange-50' : ''}
            ${isFocused ? 'border-[#E25E3E] ring-2 ring-[#E25E3E]' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}
          `}
          onClick={() => !disabled && inputRef.current?.focus()}
        >
          {/* Label */}
          <span className="text-xs text-gray-500 font-medium mb-0.5">
            {label}
          </span>

          {/* Input field - hidden visually but functional */}
          <input
            ref={inputRef}
            type={type}
            value={isFocused && formatValue ? value : displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={isFocused ? placeholder : ''}
            disabled={disabled}
            className={`
              w-full bg-transparent border-none outline-none
              text-sm
              ${hasValue ? 'text-[#E25E3E] font-semibold' : 'text-gray-700'}
              placeholder:text-gray-400
              ${disabled ? 'cursor-not-allowed' : ''}
            `}
          />

          {/* Display placeholder when not focused and no value */}
          {showPlaceholder && (
            <span className="absolute bottom-2 left-4 text-sm text-gray-400 pointer-events-none">
              {placeholder}
            </span>
          )}
        </div>
      </div>
    )
  },
)

FilterMenuInput.displayName = 'FilterMenuInput'

export default FilterMenuInput
