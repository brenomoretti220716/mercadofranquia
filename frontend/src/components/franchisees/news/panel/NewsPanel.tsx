'use client'

import { Suspense, useCallback, useMemo, useState } from 'react'
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs'

import FilterChips from '@/src/components/franchisees/news/components/FilterChips'
import TemplateNewsCard from '@/src/components/franchisees/news/components/TemplateNewsCard'
import TestimonialCard from '@/src/components/franchisees/news/components/TestimonialCard'
import SearchBar from '@/src/components/ui/SearchBar'
import { Pagination } from '@/src/components/ui/Pagination'
import { useNews } from '@/src/hooks/news/useNews'
import { formatDateToBrazilian } from '@/src/utils/dateFormatters'
import { generateSlug } from '@/src/utils/generateSlug'
import { calculateReadTime, formatReadTime } from '@/src/utils/readTime'
import { getNewsCategoryByValue } from '@/src/constants/newsCategories'
import NewsListSkeleton from '@/src/components/ui/skeletons/NewsListSkeleton'

// Mock testimonial data (same as template)
// Note: franchiseId is optional - when real data is available, include franchise IDs for clickable links
const testimonials = [
  {
    image: '/placeholder.svg',
    name: 'Maria Santos',
    role: 'Franqueada há 3 anos',
    franchise: 'Açaí Express',
    location: 'São Paulo/SP',
    testimonial:
      'O suporte da rede foi fundamental para o sucesso do meu negócio. Em 2 anos, já abri minha segunda unidade!',
    rating: 5,
    franchiseId: undefined, // Will be populated when real data is available
  },
  {
    image: '/placeholder.svg',
    name: 'Carlos Oliveira',
    role: 'Franqueado há 2 anos',
    franchise: 'TechRepair',
    location: 'Belo Horizonte/MG',
    testimonial:
      'Investir em franquia foi a melhor decisão da minha vida. O retorno veio mais rápido do que eu esperava.',
    rating: 5,
    franchiseId: undefined, // Will be populated when real data is available
  },
  {
    image: '/placeholder.svg',
    name: 'Ana Paula Mendes',
    role: 'Franqueada há 1 ano',
    franchise: 'Bella Estética',
    location: 'Curitiba/PR',
    testimonial:
      'A estrutura de treinamento me deu toda a segurança para empreender mesmo sem experiência prévia no setor.',
    rating: 5,
    franchiseId: undefined, // Will be populated when real data is available
  },
]

interface NewsListSectionProps {
  page: number
  limit: number
  searchTerm: string
  setPage: (page: number) => void
  activeCategoryLabel?: string
}

function NewsListSection({
  page,
  limit,
  searchTerm,
  setPage,
  activeCategoryLabel,
}: NewsListSectionProps) {
  const { data } = useNews({
    page,
    limit,
    search: searchTerm,
    category: activeCategoryLabel,
  })
  const total = data?.total || 0

  const { mainNews, sidebarNews, bottomNews, hasNews } = useMemo(() => {
    const items = (data?.items ?? []).filter((item) => Boolean(item?.id))

    return {
      mainNews: items[0] ?? null,
      sidebarNews: items.slice(1, 4),
      bottomNews: items.slice(4, 8),
      hasNews: items.length > 0,
    }
  }, [data?.items])

  const resolveHref = useCallback(
    (title: string | undefined, id: string | undefined) =>
      id ? `/noticias/${generateSlug(title || '', id)}` : '#',
    [],
  )

  if (!hasNews) {
    return (
      <section className="pb-12">
        <div className="container">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground text-center">
              {searchTerm
                ? `Nenhuma notícia encontrada para "${searchTerm}"`
                : 'Nenhuma notícia disponível'}
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="news-panel-list" className="pb-12">
      <div className="container">
        {/* Top Row - Asymmetric Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Featured News */}
          {mainNews && mainNews.id && (
            <div className="lg:col-span-2">
              <TemplateNewsCard
                photoUrl={mainNews.photoUrl}
                title={mainNews.title || ''}
                summary={mainNews.summary || ''}
                date={formatDateToBrazilian(mainNews.updatedAt)}
                readTime={formatReadTime(calculateReadTime(mainNews.content))}
                tag={mainNews.category}
                variant="large"
                href={resolveHref(mainNews.title, mainNews.id)}
              />
            </div>
          )}

          {/* Side News */}
          {sidebarNews.length > 0 && (
            <div className="flex flex-col gap-6">
              {sidebarNews.map((newsItem) => (
                <TemplateNewsCard
                  key={newsItem.id}
                  photoUrl={newsItem.photoUrl}
                  title={newsItem.title || ''}
                  summary={newsItem.summary || ''}
                  date={formatDateToBrazilian(newsItem.updatedAt)}
                  readTime={formatReadTime(calculateReadTime(newsItem.content))}
                  tag={newsItem.category}
                  variant="medium"
                  href={resolveHref(newsItem.title, newsItem.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Row - 3 Equal Cards */}
        {bottomNews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bottomNews.map((newsItem) => (
              <TemplateNewsCard
                key={newsItem.id}
                photoUrl={newsItem.photoUrl}
                title={newsItem.title || ''}
                summary={newsItem.summary || ''}
                date={formatDateToBrazilian(newsItem.updatedAt)}
                readTime={formatReadTime(calculateReadTime(newsItem.content))}
                tag={newsItem.category}
                variant="small"
                href={resolveHref(newsItem.title, newsItem.id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-center mt-10">
          <Pagination
            page={page}
            total={total}
            limit={limit}
            onPageChange={setPage}
            scrollToId="news-panel-list"
            scrollMarginTop={80}
          />
        </div>
      </div>
    </section>
  )
}

export default function NewsPanel() {
  const [searchInput, setSearchInput] = useQueryState(
    'search',
    parseAsString.withDefault(''),
  )
  const [searchTerm, setSearchTerm] = useState(searchInput)
  const [categoryFilter, setCategoryFilter] = useQueryState(
    'category',
    parseAsString.withDefault(''),
  )
  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions({ history: 'push' }),
  )
  const limit = 8
  const activeCategorySlug = categoryFilter || undefined
  const activeCategoryLabel = useMemo(() => {
    if (!activeCategorySlug) return undefined
    const categoryInfo = getNewsCategoryByValue(activeCategorySlug)
    return categoryInfo?.label
  }, [activeCategorySlug])

  return (
    <>
      {/* Hero Section */}
      <section className="py-10 md:py-14">
        <div className="container">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-[hsl(10_79%_95%)] text-primary rounded-full">
              <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                <path d="M18 14h-8" />
                <path d="M15 18h-5" />
                <path d="M10 6h8v4h-8V6Z" />
              </svg>
              <span className="text-sm font-medium">Central de Notícias</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Notícias do Mercado de Franquias
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Fique por dentro das últimas novidades, tendências e oportunidades
            do setor de franchising.
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section className="pb-8">
        <div className="container">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <SearchBar
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                setSearchTerm={setSearchTerm}
                setPage={setPage}
              />
            </div>

            {/* Filter Chips */}
            <FilterChips
              activeCategorySlug={activeCategorySlug}
              onCategoryChange={(slug) => {
                setPage(1)
                if (!slug) {
                  setCategoryFilter(null)
                } else {
                  setCategoryFilter(slug)
                }
              }}
            />
          </div>
        </div>
      </section>

      {/* News Grid */}
      <Suspense
        fallback={
          <section id="news-panel-list" className="pb-12">
            <NewsListSkeleton />
          </section>
        }
      >
        <NewsListSection
          page={page}
          limit={limit}
          searchTerm={searchTerm}
          setPage={setPage}
          activeCategoryLabel={activeCategoryLabel}
        />
      </Suspense>

      {/* Testimonials Section */}
      <section className="py-16 bg-secondary">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              O que dizem nossos franqueados
            </h2>
            <p className="text-muted-foreground">
              Histórias reais de quem transformou seu sonho em negócio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
