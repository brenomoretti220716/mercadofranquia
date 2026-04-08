import { forwardRef, ReactElement, isValidElement } from 'react'
import { UseFormRegisterReturn } from 'react-hook-form'

interface FormInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  leftIcon?: ReactElement
  rightElement?: ReactElement
  error?: string
  register?: UseFormRegisterReturn
  paddingVariant?: 'with-icon' | 'without-icon' | 'custom'
  className?: string
  labelClassName?: string
  errorClassName?: string
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      leftIcon,
      rightElement,
      error,
      register,
      paddingVariant,
      className = '',
      labelClassName = 'mb-1 font-medium',
      errorClassName = 'text-red-500 text-sm mt-1',
      disabled,
      id,
      ...inputProps
    },
    ref,
  ) => {
    const hasLeftIcon = !!leftIcon
    const paddingClass =
      paddingVariant === 'custom'
        ? ''
        : paddingVariant === 'without-icon'
          ? 'pl-5'
          : hasLeftIcon
            ? 'pl-10'
            : 'px-3'

    const baseInputClasses =
      'w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors'
    const disabledClasses = disabled ? 'disabled:bg-gray-100' : ''
    const inputClasses =
      `${paddingClass} ${baseInputClasses} ${disabledClasses} ${className}`.trim()

    const inputId = id || inputProps.name

    const isLeftIconInteractive =
      leftIcon && isValidElement(leftIcon) && leftIcon.type === 'button'

    const input = (
      <div className="relative">
        {leftIcon && !isLeftIconInteractive && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        {leftIcon && isLeftIconInteractive && leftIcon}

        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          disabled={disabled}
          {...register}
          {...inputProps}
        />

        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {rightElement}
          </div>
        )}
      </div>
    )

    if (label) {
      return (
        <div className="flex flex-col">
          <label htmlFor={inputId} className={labelClassName}>
            {label}
          </label>
          {input}
          {error && <div className={errorClassName}>{error}</div>}
        </div>
      )
    }

    return input
  },
)

FormInput.displayName = 'FormInput'

export default FormInput
