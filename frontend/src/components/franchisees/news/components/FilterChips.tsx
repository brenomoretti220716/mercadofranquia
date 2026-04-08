'use client'

import {
  ALL_NEWS_CATEGORY_OPTION,
  NEWS_CATEGORY_FILTER_OPTIONS,
  getNewsCategoryByValue,
} from '@/src/constants/newsCategories'

interface FilterChipsProps {
  activeCategorySlug?: string
  onCategoryChange?: (slug: string | undefined) => void
}

const CATEGORY_FILTER_OPTIONS = [
  {
    slug: undefined as string | undefined,
    label: ALL_NEWS_CATEGORY_OPTION.label,
  },
  ...NEWS_CATEGORY_FILTER_OPTIONS.map((category) => ({
    slug: category.slug as string | undefined,
    label: category.label,
  })),
]

export default function FilterChips({
  activeCategorySlug,
  onCategoryChange,
}: FilterChipsProps) {
  const activeLabel =
    activeCategorySlug && getNewsCategoryByValue(activeCategorySlug)
      ? getNewsCategoryByValue(activeCategorySlug)?.label
      : ALL_NEWS_CATEGORY_OPTION.label

  return (
    <div className="flex flex-nowrap gap-2 overflow-x-auto">
      {CATEGORY_FILTER_OPTIONS.map((option) => (
        <button
          key={option.slug ?? 'all'}
          type="button"
          className={`chip ${
            option.label === activeLabel ? 'chip-active' : 'chip-inactive'
          } whitespace-nowrap`}
          onClick={() => onCategoryChange?.(option.slug)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
