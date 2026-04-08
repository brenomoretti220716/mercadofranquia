import { forwardRef, ChangeEvent, useState, useEffect } from 'react'
import { UseFormRegisterReturn, useFormContext } from 'react-hook-form'
import FormInput from './FormInput'
import { formatCNPJ, stripNonDigits } from '@/src/utils/formaters'

interface CNPJInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  error?: string
  register?: UseFormRegisterReturn
  name?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const CNPJInput = forwardRef<HTMLInputElement, CNPJInputProps>(
  (
    {
      label,
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
        ? formatCNPJ(String(value))
        : defaultValue
          ? formatCNPJ(String(defaultValue))
          : '',
    )

    useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(formatCNPJ(String(value)))
      } else if (defaultValue !== undefined) {
        setDisplayValue(formatCNPJ(String(defaultValue)))
      }
    }, [value, defaultValue])

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      const formattedValue = formatCNPJ(inputValue)
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
        placeholder="00.000.000/0000-00"
        maxLength={18}
        className={className}
        name={fieldName}
        {...registerRest}
        {...props}
      />
    )
  },
)

CNPJInput.displayName = 'CNPJInput'

export default CNPJInput
