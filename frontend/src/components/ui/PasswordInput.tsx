import { forwardRef, ReactElement } from 'react'
import { UseFormRegisterReturn } from 'react-hook-form'
import LockIcon from '../icons/lockIcon'
import UnlockIcon from '../icons/unlockIcon'

interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  register?: UseFormRegisterReturn
  /**
   * Whether to show the password visibility toggle button
   * @default true
   */
  showToggle?: boolean
  /**
   * Custom icon component to use as left icon (defaults to LockIcon/UnlockIcon)
   */
  setShowPassword?: (showPassword: boolean) => void
  showPassword?: boolean
  leftIcon?: ReactElement
  className?: string
}

/**
 * Password input component with visibility toggle
 * Supports react-hook-form integration
 */
const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      label,
      error,
      register,
      showToggle = true,
      showPassword,
      setShowPassword,
      leftIcon,
      className = '',
      disabled,
      id,
      ...inputProps
    },
    ref,
  ) => {
    const toggleIcon = showPassword ? (
      <UnlockIcon width={20} height={20} color="#747473" />
    ) : (
      <LockIcon width={20} height={20} color="#747473" />
    )

    // Build the input element manually to handle the toggle button properly
    const inputId = id || inputProps.name || 'password'

    const inputElement = (
      <div className="relative">
        {showToggle && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword?.(!showPassword)}
            className="absolute inset-y-0 left-0 pl-3 flex items-center z-10"
            disabled={disabled}
          >
            {toggleIcon}
          </button>
        )}
        {!showToggle && leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={showPassword ? 'text' : 'password'}
          className={`pl-10 w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors ${disabled ? 'disabled:bg-gray-100' : ''} ${className}`}
          placeholder={inputProps.placeholder || '********'}
          disabled={disabled}
          {...inputProps}
          {...register}
        />
      </div>
    )

    if (label) {
      return (
        <div className="flex flex-col">
          <label htmlFor={inputId} className="mb-1 font-medium">
            {label}
          </label>
          {inputElement}
          {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
        </div>
      )
    }

    return inputElement
  },
)

PasswordInput.displayName = 'PasswordInput'

export default PasswordInput
