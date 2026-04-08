import {
  useFormContext,
  UseFormRegisterReturn,
  useWatch,
} from 'react-hook-form'

interface RangeInputProps {
  label: string
  minId: string
  maxId: string
  minPlaceholder?: string
  maxPlaceholder?: string
  minError?: string
  maxError?: string
  minRegister: UseFormRegisterReturn
  maxRegister: UseFormRegisterReturn
  disabled?: boolean
  formatType?: 'currency' | 'months' | 'none'
  labelClassName?: string
  errorClassName?: string
}

export default function RangeInput({
  label,
  minId,
  maxId,
  minPlaceholder = 'Mínimo',
  maxPlaceholder = 'Máximo',
  minError,
  maxError,
  minRegister,
  maxRegister,
  disabled,
  labelClassName = 'mb-1 font-medium',
  errorClassName = 'text-red-500 text-sm mt-1',
}: RangeInputProps) {
  // Watch the minimum value to enable/disable maximum input
  const { control } = useFormContext()
  const minValue = useWatch({ control, name: minRegister.name })

  const baseInputClasses =
    'w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors'
  const disabledClasses = disabled ? 'disabled:bg-gray-100' : ''
  const inputClasses = `${baseInputClasses} ${disabledClasses}`.trim()

  // Maximum is disabled if minimum is empty or disabled
  const maxDisabled = disabled || !minValue || minValue === ''

  // Only allow numeric input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault()
    }
  }

  return (
    <div className="flex flex-col">
      <label className={labelClassName}>{label}</label>

      <div className="flex gap-3">
        {/* Minimum Input */}
        <div className="flex-1">
          <input
            id={minId}
            type="text"
            inputMode="numeric"
            placeholder={minPlaceholder}
            className={inputClasses}
            disabled={disabled}
            onKeyPress={handleKeyPress}
            {...minRegister}
          />
          {minError && <div className={errorClassName}>{minError}</div>}
        </div>

        {/* Maximum Input */}
        <div className="flex-1">
          <input
            id={maxId}
            type="text"
            inputMode="numeric"
            placeholder={maxPlaceholder}
            className={inputClasses}
            disabled={maxDisabled}
            onKeyPress={handleKeyPress}
            {...maxRegister}
          />
          {maxError && <div className={errorClassName}>{maxError}</div>}
          {maxDisabled && minValue === '' && (
            <div className="text-xs text-muted-foreground mt-1">
              Preencha o valor mínimo primeiro
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
