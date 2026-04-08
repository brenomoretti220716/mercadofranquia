import { ReactNode } from 'react'

interface FormFieldWrapperProps {
  label: string
  htmlFor: string
  error?: string
  children: ReactNode
  className?: string
}

/**
 * Wrapper component for form fields that provides consistent label and error display
 */
export default function FormFieldWrapper({
  label,
  htmlFor,
  error,
  children,
  className = '',
}: FormFieldWrapperProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      <label htmlFor={htmlFor} className="mb-1 font-medium">
        {label}
      </label>
      {children}
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  )
}
