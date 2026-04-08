'use client'

import * as React from 'react'

// Simple utility function to concatenate class names
const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ')
}

interface DigitCodeInputProps
  extends Omit<React.ComponentProps<'input'>, 'onChange'> {
  maxLength?: number
  value?: string
  onChange?: (value: string) => void
  onComplete?: (value: string) => void
  inputSeparator?: boolean
}

const DigitCodeInput = React.forwardRef<HTMLInputElement, DigitCodeInputProps>(
  (
    {
      className,
      maxLength = 6,
      value = '',
      onChange,
      onComplete,
      inputSeparator = true,
      ...props
    },
    ref,
  ) => {
    const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null)
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

    // Ensure value is properly formatted
    const currentValue = value || ''
    const paddedValue = currentValue.padEnd(maxLength, '')

    const handleInputChange = (index: number, inputValue: string) => {
      // Only allow single digit
      const digit = inputValue.replace(/\D/g, '').slice(0, 1)

      const newValue = paddedValue.split('')
      newValue[index] = digit
      const newValueString = newValue.join('')

      onChange?.(newValueString)

      // Auto-focus next input
      if (digit && index < maxLength - 1) {
        inputRefs.current[index + 1]?.focus()
      }

      // Call onComplete when all digits are filled
      if (newValueString.length === maxLength) {
        onComplete?.(newValueString)
      }
    }

    const handleKeyDown = (
      index: number,
      e: React.KeyboardEvent<HTMLInputElement>,
    ) => {
      if (e.key === 'Backspace') {
        if (!paddedValue[index] && index > 0) {
          // Move to previous input if current is empty
          inputRefs.current[index - 1]?.focus()
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus()
      } else if (e.key === 'ArrowRight' && index < maxLength - 1) {
        inputRefs.current[index + 1]?.focus()
      }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault()
      const pastedData = e.clipboardData
        .getData('text')
        .replace(/\D/g, '')
        .slice(0, maxLength)

      if (pastedData.length > 0) {
        onChange?.(pastedData)

        // Focus the next empty input or the last input
        const nextIndex = Math.min(pastedData.length, maxLength - 1)
        inputRefs.current[nextIndex]?.focus()

        if (pastedData.length === maxLength) {
          onComplete?.(pastedData)
        }
      }
    }

    const isOdd = maxLength % 2 !== 0

    const midIndex = isOdd ? Math.floor(maxLength / 2) : maxLength / 2

    return (
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
        {Array.from({ length: maxLength }, (_, index) => {
          const shouldShowSeparator =
            inputSeparator && !isOdd && index === midIndex - 1

          return (
            <React.Fragment key={index}>
              <input
                ref={(el) => {
                  inputRefs.current[index] = el
                  if (index === 0) {
                    if (typeof ref === 'function') {
                      ref(el)
                    } else if (ref) {
                      ref.current = el
                    }
                  }
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={paddedValue[index] || ''}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(null)}
                className={cn(
                  'w-9 h-12 sm:w-11 sm:h-14 md:w-14 md:h-16 text-center text-base sm:text-lg md:text-xl font-semibold border border-input rounded-md',
                  'bg-white text-foreground placeholder-muted-foreground',
                  'focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary',
                  'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-muted-foreground',
                  'transition-colors duration-200',
                  'selection:bg-primary selection:text-white',
                  focusedIndex === index &&
                    'ring-1 ring-primary border-primary',
                  className,
                )}
                {...props}
              />
              {shouldShowSeparator && (
                <div className="w-3 sm:w-4 md:w-5 h-0.5 bg-muted-foreground/30" />
              )}
            </React.Fragment>
          )
        })}
      </div>
    )
  },
)

DigitCodeInput.displayName = 'DigitCodeInput'

export { DigitCodeInput }
