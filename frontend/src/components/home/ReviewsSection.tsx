'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import ReviewsSectionSkeleton from '@/src/components/ui/skeletons/ReviewsSectionSkeleton'
import { reviewQueries } from '@/src/queries/reviews'
import type { ApiReview, ReviewCard } from '@/src/schemas/franchises/Reviews'
import { formatDateToBrazilianLong } from '@/src/utils/dateFormatters'
import Link from 'next/link'
import QuoteIcon from '../icons/quoteIcon'
import StarIcon from '../icons/starIcon'

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean)

  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()

  const first = parts[0].charAt(0).toUpperCase()
  const last = parts[parts.length - 1].charAt(0).toUpperCase()

  return `${first}${last}`
}

function mapReviewsToCards(reviews: ApiReview[]): ReviewCard[] {
  return reviews.map((review) => {
    const resolvedName = review.authorName
    const name = review.anonymous ? 'Anônimo' : resolvedName || 'Usuário'
    const franchiseName = review.franchise?.name
    const franchiseSlug = review.franchise?.slug
    const date = formatDateToBrazilianLong(review.createdAt)

    return {
      text: review.comment,
      name,
      franchise: franchiseName,
      date,
      initials: getInitials(name),
      rating: review.rating,
      franchiseSlug,
    }
  })
}

const ReviewsSection = () => {
  const { data, isLoading, isError } = useQuery(reviewQueries.latest(3))

  const reviews = useMemo(() => mapReviewsToCards(data ?? []), [data])

  if (isError || (!isLoading && reviews.length === 0)) {
    return null
  }

  return (
    <section className="py-8 md:py-16">
      <div className="container mx-auto px-4">
        <div className="text-left mb-6 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Últimas Avaliações
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Depoimentos reais de franqueados satisfeitos
          </p>
        </div>

        {isLoading ? (
          <ReviewsSectionSkeleton cards={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((review, index) => {
              const card = (
                <div
                  key={index}
                  className="bg-card rounded-2xl p-6 border border-border shadow-sm relative transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <QuoteIcon className="absolute top-4 right-4 w-8 h-8 text-primary/10 color-primary/90" />

                  <p className="text-foreground italic mb-6 relative z-10">
                    &quot;{review.text}&quot;
                  </p>

                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <StarIcon
                        key={i}
                        width={16}
                        height={16}
                        color="#facc15"
                        filled={true}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <span className="font-bold text-primary">
                        {review.initials}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p
                        className="font-semibold text-foreground truncate"
                        title={review.name}
                      >
                        {review.name}
                      </p>
                      {review.franchise && (
                        <p
                          className="text-sm text-muted-foreground truncate"
                          title={review.franchise}
                        >
                          {review.franchise}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end items-center gap-3 pt-4">
                    <p className="text-xs text-muted-foreground truncate">
                      {review.date}
                    </p>
                  </div>
                </div>
              )

              if (review.franchiseSlug) {
                return (
                  <Link href={`/ranking/${review.franchiseSlug}`} key={index}>
                    {card}
                  </Link>
                )
              }

              return <div key={index}>{card}</div>
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default ReviewsSection
