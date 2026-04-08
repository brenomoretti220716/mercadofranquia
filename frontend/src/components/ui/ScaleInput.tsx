'use client'

import { UseFormRegisterReturn } from 'react-hook-form'

interface ScaleInputProps {
  label: string
  min?: number
  max?: number
  register: UseFormRegisterReturn
  value?: number
  onChange?: (value: number) => void
  error?: string
  disabled?: boolean
  className?: string
}

export default function ScaleInput({
  label,
  min = 0,
  max = 10,
  register,
  value,
  onChange,
  error,
  disabled = false,
  className = '',
}: ScaleInputProps) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  return (
    <div className={`flex flex-col ${className}`}>
      <label className="mb-1 font-medium text-sm sm:text-base">{label}</label>
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <input type="hidden" {...register} />
        {steps.map((step) => {
          const isSelected = value === step
          return (
            <button
              key={step}
              type="button"
              disabled={disabled}
              onClick={() => onChange?.(step)}
              className={`
                w-9 h-9 sm:w-10 sm:h-10 rounded-full text-xs sm:text-sm font-semibold transition-colors
                border-2
                ${
                  isSelected
                    ? 'bg-primary text-white border-primary'
                    : 'bg-background border-input text-foreground hover:border-primary/50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {step}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {min} = mínimo, {max} = máximo
      </p>
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  )
}
