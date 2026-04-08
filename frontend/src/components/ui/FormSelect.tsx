'use client'

import { forwardRef, useRef, useState, useEffect, ReactElement } from 'react'
import { UseFormRegisterReturn } from 'react-hook-form'
import ArrowDownIcon from '../icons/arrowDownIcon'

interface SelectOption {
  value: string
  label: string
}

interface FormSelectProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'size' | 'onChange'
  > {
  label?: string
  leftIcon?: ReactElement
  rightIcon?: ReactElement
  error?: string
  register?: UseFormRegisterReturn
  options: SelectOption[]
  placeholder?: string
  className?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

/**
 * Custom select dropdown component with consistent styling matching CitySelect
 * Supports react-hook-form integration
 */
const FormSelect = forwardRef<HTMLInputElement, FormSelectProps>(
  (
    {
      label,
      leftIcon,
      rightIcon,
      error,
      register,
      options,
      placeholder,
      className = '',
      disabled,
      id,
      value,
      ...selectProps
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const hasLeftIcon = !!leftIcon
    // Match CitySelect styling exactly: "w-full px-3 py-2 pl-10"
    const paddingClass = hasLeftIcon
      ? 'px-3 py-2 pl-10 pr-10'
      : 'px-3 py-2 pr-10'

    // Match CitySelect focus styling exactly
    const baseInputClasses =
      'w-full border border-[#747473] rounded-md focus:outline-none focus:ring-2 focus:ring-[#E25E3E] focus:border-[#E25E3E] bg-white transition-colors cursor-pointer'
    const disabledClasses = disabled ? 'disabled:bg-gray-100' : ''
    const inputClasses =
      `${paddingClass} ${baseInputClasses} ${disabledClasses} ${className}`.trim()

    const selectId = id || selectProps.name
    const listboxId = `${selectId || 'select'}-listbox`
    const defaultRightIcon = rightIcon || (
      <ArrowDownIcon width={20} height={20} />
    )

    // Get current value (from props)
    const currentValue = (value as string) || ''
    const selectedOption = options.find((opt) => opt.value === currentValue)
    const displayText = selectedOption
      ? selectedOption.label
      : placeholder || ''

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false)
          setSelectedIndex(-1)
        }
      }

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
          document.removeEventListener('mousedown', handleClickOutside)
        }
      }
    }, [isOpen])

    // Scroll to selected item
    useEffect(() => {
      if (selectedIndex >= 0 && dropdownRef.current) {
        const selectedElement = dropdownRef.current.children[
          selectedIndex
        ] as HTMLElement
        if (selectedElement) {
          selectedElement.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth',
          })
        }
      }
    }, [selectedIndex])

    // Keyboard navigation
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!isOpen || options.length === 0) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          setIsOpen(true)
        }
        return
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex((prev) => {
            const newIndex = prev < options.length - 1 ? prev + 1 : 0
            return newIndex
          })
          break

        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex((prev) => {
            const newIndex = prev > 0 ? prev - 1 : options.length - 1
            return newIndex
          })
          break

        case 'Enter':
          event.preventDefault()
          if (selectedIndex >= 0 && selectedIndex < options.length) {
            handleSelectOption(options[selectedIndex])
          }
          break

        case 'Escape':
          event.preventDefault()
          setIsOpen(false)
          setSelectedIndex(-1)
          break
      }
    }

    const handleSelectOption = (option: SelectOption) => {
      // Create synthetic event for react-hook-form
      const syntheticEvent = {
        target: {
          value: option.value,
          name: selectProps.name || register?.name || '',
        },
        currentTarget: {
          value: option.value,
          name: selectProps.name || register?.name || '',
        },
      } as React.ChangeEvent<HTMLInputElement>

      // Call register onChange if available (react-hook-form will update the form state)
      if (register?.onChange) {
        register.onChange(syntheticEvent)
      }

      // Call custom onChange if provided
      if (selectProps.onChange) {
        selectProps.onChange(syntheticEvent)
      }

      setIsOpen(false)
      setSelectedIndex(-1)
    }

    const handleToggle = () => {
      if (!disabled) {
        setIsOpen(!isOpen)
        setSelectedIndex(-1)
      }
    }

    // Hidden input for react-hook-form integration
    // The register will handle the form state, we just need to sync the value
    const hiddenInput = register ? (
      <input type="hidden" {...register} value={currentValue} />
    ) : selectProps.name ? (
      <input
        type="hidden"
        name={selectProps.name}
        value={currentValue}
        readOnly
      />
    ) : null

    const select = (
      <div ref={containerRef} className="relative">
        {hiddenInput}

        {/* Custom select button/input */}
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          tabIndex={disabled ? -1 : 0}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className={inputClasses}
          id={selectId}
        >
          <div className="flex items-center min-w-0">
            <span
              className={`${selectedOption ? 'text-gray-900' : 'text-gray-500'} truncate min-w-0 flex-1`}
            >
              {displayText}
            </span>
          </div>
        </div>

        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
            {leftIcon}
          </div>
        )}

        {defaultRightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {defaultRightIcon}
          </div>
        )}

        {/* Custom dropdown - matching CitySelect style */}
        {isOpen && options.length > 0 && (
          <div
            ref={dropdownRef}
            id={listboxId}
            role="listbox"
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto pb-2"
          >
            {options.map((option, index) => {
              const isActive =
                option.value === currentValue || index === selectedIndex

              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSelectOption(option)}
                  className={`px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                    option.value === currentValue
                      ? 'bg-[#E25E3E] text-white'
                      : isActive
                        ? 'bg-[#E4AC9E]/30 text-[#E25E3E]'
                        : 'hover:bg-[#E4AC9E]/20 hover:text-[#E25E3E]'
                  }`}
                >
                  <div className="text-sm">
                    {option.value === currentValue && (
                      <span className="mr-2">✓</span>
                    )}
                    <span>{option.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )

    if (label) {
      return (
        <div className="flex flex-col">
          <label htmlFor={selectId} className="mb-1 font-medium">
            {label}
          </label>
          {select}
          {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
        </div>
      )
    }

    return select
  },
)

FormSelect.displayName = 'FormSelect'

export default FormSelect
