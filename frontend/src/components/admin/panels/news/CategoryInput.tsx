'use client'

import FormInput from '@/src/components/ui/FormInput'
import { NEWS_CATEGORY_FILTER_OPTIONS } from '@/src/constants/newsCategories'
import type { UseFormRegisterReturn } from 'react-hook-form'

interface CategoryInputProps {
  label: string
  id: string
  placeholder?: string
  error?: string
  disabled?: boolean
  paddingVariant?: 'with-icon' | 'without-icon' | 'custom'
  register?: UseFormRegisterReturn
  onSelectSuggestion: (value: string) => void
}

export default function CategoryInput({
  label,
  id,
  placeholder,
  error,
  disabled,
  paddingVariant = 'without-icon',
  register,
  onSelectSuggestion,
}: CategoryInputProps) {
  return (
    <div className="space-y-2">
      <FormInput
        label={label}
        id={id}
        type="text"
        placeholder={placeholder}
        error={error}
        disabled={disabled}
        paddingVariant={paddingVariant}
        register={register}
      />

      <div className="flex flex-nowrap gap-2 overflow-x-auto">
        {NEWS_CATEGORY_FILTER_OPTIONS.map((category) => (
          <button
            key={category.slug}
            type="button"
            className="px-3 py-1 text-xs rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 whitespace-nowrap"
            disabled={disabled}
            onClick={() => onSelectSuggestion(category.label)}
          >
            {category.label}
          </button>
        ))}
      </div>
    </div>
  )
}
