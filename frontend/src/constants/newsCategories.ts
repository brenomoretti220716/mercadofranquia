export type NewsCategorySlug =
  | 'geral'
  | 'franquias'
  | 'mercado'
  | 'tendencias'
  | 'guia'
  | 'novidades'
  | 'financas'
  | 'tecnologia'
  | 'eventos'
  | 'promocoes'

export interface NewsCategoryOption {
  slug: NewsCategorySlug
  label: string
  colorClass: string
}

export const NEWS_CATEGORIES: NewsCategoryOption[] = [
  {
    slug: 'geral',
    label: 'Geral',
    colorClass: 'bg-blue-100 text-blue-800',
  },
  {
    slug: 'franquias',
    label: 'Franquias',
    colorClass: 'bg-green-100 text-green-800',
  },
  {
    slug: 'mercado',
    label: 'Mercado',
    colorClass: 'bg-purple-100 text-purple-800',
  },
  {
    slug: 'tendencias',
    label: 'Tendências',
    colorClass: 'bg-indigo-100 text-indigo-800',
  },
  {
    slug: 'guia',
    label: 'Guia',
    colorClass: 'bg-sky-100 text-sky-800',
  },
  {
    slug: 'novidades',
    label: 'Novidades',
    colorClass: 'bg-pink-100 text-pink-800',
  },
  {
    slug: 'financas',
    label: 'Finanças',
    colorClass: 'bg-emerald-100 text-emerald-800',
  },
  {
    slug: 'tecnologia',
    label: 'Tecnologia',
    colorClass: 'bg-orange-100 text-orange-800',
  },
  {
    slug: 'eventos',
    label: 'Eventos',
    colorClass: 'bg-red-100 text-red-800',
  },
  {
    slug: 'promocoes',
    label: 'Promoções',
    colorClass: 'bg-yellow-100 text-yellow-800',
  },
]

// Subset of categories prioritized for filters/suggestions
export const NEWS_CATEGORY_FILTER_SLUGS: NewsCategorySlug[] = [
  'mercado',
  'tendencias',
  'guia',
  'novidades',
  'financas',
  'tecnologia',
]

export const NEWS_CATEGORY_FILTER_OPTIONS: NewsCategoryOption[] =
  NEWS_CATEGORIES.filter((category) =>
    NEWS_CATEGORY_FILTER_SLUGS.includes(category.slug),
  )

export const ALL_NEWS_CATEGORY_FILTER_VALUE = 'all'

export const ALL_NEWS_CATEGORY_OPTION = {
  value: ALL_NEWS_CATEGORY_FILTER_VALUE,
  label: 'Todas',
} as const

export function getNewsCategoryByValue(value: string | null | undefined) {
  if (!value) return undefined

  const normalized = value.toLowerCase().trim()

  return NEWS_CATEGORIES.find(
    (category) =>
      category.slug === normalized ||
      category.label.toLowerCase() === normalized,
  )
}
