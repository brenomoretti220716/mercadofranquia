import { formatPhone, stripNonDigits } from '@/src/utils/formaters'
import {
  ChangeEvent,
  forwardRef,
  ReactElement,
  useEffect,
  useRef,
  useState,
} from 'react'
import { UseFormRegisterReturn, useFormContext } from 'react-hook-form'
import FormInput from './FormInput'

interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  error?: string
  register?: UseFormRegisterReturn
  name?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  leftIcon?: ReactElement
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
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
      leftIcon,
      ...props
    },
    ref,
  ) => {
    const { onChange: registerOnChange, ...registerRest } = register || {}
    const fieldName = name || register?.name

    const formContext = useFormContext()

    // Track the last raw value we processed to avoid unnecessary reformatting
    const lastProcessedRawValue = useRef<string>(
      value
        ? stripNonDigits(String(value))
        : defaultValue
          ? stripNonDigits(String(defaultValue))
          : '',
    )

    const [displayValue, setDisplayValue] = useState<string>(
      value
        ? formatPhone(String(value))
        : defaultValue
          ? formatPhone(String(defaultValue))
          : '',
    )

    useEffect(() => {
      // Only update display value if the raw digits actually changed
      // This prevents reformatting when other fields trigger re-renders
      if (value !== undefined) {
        const incomingRaw = stripNonDigits(String(value))

        // Only update if the raw digits are different from what we last processed
        if (incomingRaw !== lastProcessedRawValue.current) {
          lastProcessedRawValue.current = incomingRaw
          setDisplayValue(formatPhone(String(value)))
        }
      } else if (defaultValue !== undefined) {
        const incomingRaw = stripNonDigits(String(defaultValue))

        // Only update if the raw digits are different from what we last processed
        if (incomingRaw !== lastProcessedRawValue.current) {
          lastProcessedRawValue.current = incomingRaw
          setDisplayValue(formatPhone(String(defaultValue)))
        }
      }
    }, [value, defaultValue])

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      const formattedValue = formatPhone(inputValue)
      const rawValue = stripNonDigits(formattedValue)

      // Update the ref to track what we're processing
      lastProcessedRawValue.current = rawValue
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
        placeholder="(00) 00000-0000"
        maxLength={15}
        className={className}
        name={fieldName}
        leftIcon={leftIcon}
        {...registerRest}
        {...props}
      />
    )
  },
)

PhoneInput.displayName = 'PhoneInput'

export default PhoneInput
