'use client'

import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'

import { getNewsImageUrl } from '@/src/components/franchisees/news/components/newsImage'
import { newsQueries } from '@/src/queries/news'
import type { NewsSchema } from '@/src/schemas/users/News'
import { formatDateToBrazilian } from '@/src/utils/dateFormatters'
import { generateSlug } from '@/src/utils/generateSlug'
import { calculateReadTime, formatReadTime } from '@/src/utils/readTime'
import CalendarIcon from '../icons/calendarIcon'
import ClockIcon from '../icons/clockIcon'

const NEWS_LIMIT = 3

function resolveHref(item: NewsSchema) {
  if (!item.id) return '/noticias'
  return `/noticias/${generateSlug(item.title, item.id)}`
}

const NewsSection = () => {
  const { data, isLoading } = useQuery(
    newsQueries.list({ page: 1, limit: NEWS_LIMIT }),
  )

  const items = (data?.items ?? []).filter((item) => Boolean(item?.id))
  const newsItems = items.slice(0, NEWS_LIMIT)

  const hasNews = newsItems.length > 0

  return (
    <section className="py-8 md:py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Últimas Notícias
            </h2>
            <p className="text-muted-foreground">
              Fique por dentro das novidades do mercado de franquias
            </p>
          </div>
          <Link
            href="/noticias"
            className="rounded-full border border-border px-6 py-2 text-sm font-medium hover:bg-secondary transition-colors"
          >
            Ver todas as notícias
          </Link>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(NEWS_LIMIT)].map((_, index) => (
              <div
                key={index}
                className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm"
              >
                <div className="aspect-video bg-secondary animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-full animate-pulse" />
                  <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !hasNews && (
          <p className="text-muted-foreground">
            Nenhuma notícia disponível no momento.
          </p>
        )}

        {/* News list */}
        {!isLoading && hasNews && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {newsItems.map((item) => {
              const image = getNewsImageUrl(item.photoUrl, '/assets/news.jpg')
              const date = formatDateToBrazilian(
                item.updatedAt ?? item.createdAt,
              )
              const readTime = formatReadTime(calculateReadTime(item.content))

              return (
                <Link key={item.id} href={resolveHref(item)} className="h-full">
                  <article className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group h-full">
                    <div className="aspect-video bg-secondary relative overflow-hidden">
                      <Image
                        src={image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        width={1000}
                        height={1000}
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {item.summary}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarIcon
                            width={14}
                            height={14}
                            color="#747473"
                          />
                          {date}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockIcon width={14} height={14} color="#747473" />
                          {readTime}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default NewsSection
