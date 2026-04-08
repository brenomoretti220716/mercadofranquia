import { forwardRef, useState } from 'react'
import { UseFormRegisterReturn } from 'react-hook-form'

interface FormTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string
  error?: string
  register?: UseFormRegisterReturn
  /**
   * Whether to show character count
   */
  showCharacterCount?: boolean
  /**
   * Maximum character count (for character counter display)
   */
  maxCharacterCount?: number
  /**
   * Padding variant:
   * - 'standard': px-5 (default, used in News forms)
   * - 'compact': px-3 (used in AddComment)
   */
  paddingVariant?: 'standard' | 'compact'
  className?: string
}

/**
 * Form textarea component with consistent styling
 * Supports react-hook-form integration
 */
const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    {
      label,
      error,
      register,
      showCharacterCount = false,
      maxCharacterCount,
      paddingVariant = 'standard',
      className = '',
      disabled,
      rows = 4,
      id,
      ...textareaProps
    },
    ref,
  ) => {
    const paddingClass = paddingVariant === 'compact' ? 'px-3' : 'px-5'

    const baseTextareaClasses =
      'w-full py-2 border border-[#747473] rounded-md focus:outline-none focus:ring-2 focus:ring-[#E25E3E] focus:border-[#E25E3E] resize-none overflow-y-auto'
    const disabledClasses = disabled
      ? 'disabled:bg-gray-100 disabled:cursor-not-allowed'
      : ''
    const textareaClasses =
      `${paddingClass} ${baseTextareaClasses} ${disabledClasses} ${className}`.trim()

    const textareaId = id || textareaProps.name
    const [currentLength, setCurrentLength] = useState(0)

    const textarea = (
      <div className="flex flex-col">
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={textareaClasses}
          disabled={disabled}
          onInput={(event) => {
            if (textareaProps.onInput) {
              textareaProps.onInput(event)
            }
            setCurrentLength(event.currentTarget.value.length)
          }}
          {...textareaProps}
          {...register}
        />
        {showCharacterCount && maxCharacterCount && (
          <div className="flex justify-between items-center mt-1">
            <div />
            <div className="text-xs text-gray-500 ml-auto">
              {currentLength}/{maxCharacterCount} caracteres
            </div>
          </div>
        )}
      </div>
    )

    if (label) {
      return (
        <div className="flex flex-col">
          <label htmlFor={textareaId} className="mb-1 font-medium">
            {label}
          </label>
          {textarea}
          {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
        </div>
      )
    }

    return textarea
  },
)

FormTextarea.displayName = 'FormTextarea'

export default FormTextarea
