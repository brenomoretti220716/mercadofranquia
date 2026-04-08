import { forwardRef, ChangeEvent, useState, useEffect } from 'react'
import { useFormContext, UseFormRegisterReturn } from 'react-hook-form'
import FormInput from './FormInput'
import { formatCPF, stripNonDigits } from '@/src/utils/formaters'

interface CPFInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  error?: string
  register?: UseFormRegisterReturn
  name?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const CPFInput = forwardRef<HTMLInputElement, CPFInputProps>(
  (
    {
      label = 'CPF',
      error,
      register,
      name,
      onChange,
      value,
      defaultValue,
      className,
      ...props
    },
    ref,
  ) => {
    const { onChange: registerOnChange, ...registerRest } = register || {}
    const fieldName = name || register?.name
    const formContext = useFormContext()

    const [displayValue, setDisplayValue] = useState<string>(
      value
        ? formatCPF(String(value))
        : defaultValue
          ? formatCPF(String(defaultValue))
          : '',
    )

    useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(formatCPF(String(value)))
      } else if (defaultValue !== undefined) {
        setDisplayValue(formatCPF(String(defaultValue)))
      }
    }, [value, defaultValue])

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      const formattedValue = formatCPF(inputValue)
      const rawValue = stripNonDigits(formattedValue)

      setDisplayValue(formattedValue)

      // Update RHF state synchronously using setValue if available
      if (fieldName && formContext) {
        formContext.setValue(fieldName, rawValue, {
          shouldValidate: true,
          shouldDirty: true,
        })
      }

      // Also call register's onChange for compatibility
      if (registerOnChange) {
        const syntheticEvent = {
          ...e,
          target: { ...e.target, value: rawValue, name: fieldName },
          currentTarget: {
            ...e.currentTarget,
            value: rawValue,
            name: fieldName,
          },
        } as ChangeEvent<HTMLInputElement>
        registerOnChange(syntheticEvent)
      }

      // Call external onChange with raw value
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: { ...e.target, value: rawValue, name: fieldName },
          currentTarget: {
            ...e.currentTarget,
            value: rawValue,
            name: fieldName,
          },
        } as ChangeEvent<HTMLInputElement>
        onChange(syntheticEvent)
      }
    }

    return (
      <FormInput
        ref={ref}
        label={label}
        error={error}
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder="000.000.000-00"
        maxLength={14}
        className={className}
        name={fieldName}
        {...registerRest}
        {...props}
      />
    )
  },
)

CPFInput.displayName = 'CPFInput'

export default CPFInput
