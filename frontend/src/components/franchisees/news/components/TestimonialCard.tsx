'use client'

import Image from 'next/image'
import Link from 'next/link'

import QuoteIcon from '@/src/components/icons/quoteIcon'
import StarIcon from '@/src/components/icons/starIcon'

interface TestimonialCardProps {
  image: string
  name: string
  role: string
  franchise: string
  location: string
  testimonial: string
  rating: number
  franchiseSlug?: string
}

export default function TestimonialCard({
  image,
  name,
  role,
  franchise,
  location,
  testimonial,
  rating,
  franchiseSlug,
}: TestimonialCardProps) {
  const franchiseNameElement = franchiseSlug ? (
    <Link
      href={`/ranking/${franchiseSlug}`}
      className="text-xs text-primary font-medium hover:text-primary/80 transition-colors underline-offset-2 hover:underline"
    >
      {franchise}
    </Link>
  ) : (
    <span className="text-xs text-primary font-medium">{franchise}</span>
  )

  return (
    <div className="testimonial-card">
      {/* Decorative Quote */}
      <div className="absolute top-4 right-4 text-primary/10">
        <QuoteIcon width={48} height={48} color="currentColor" />
      </div>

      <div className="relative z-10">
        {/* Rating */}
        <div className="flex gap-0.5 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon
              key={i}
              width={16}
              height={16}
              filled={i < rating}
              color={i < rating ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
            />
          ))}
        </div>

        {/* Testimonial */}
        <p className="text-foreground mb-6 leading-relaxed">
          &quot;{testimonial}&quot;
        </p>

        {/* Author */}
        <div className="flex items-center gap-3">
          <Image
            src={image}
            alt={name}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
          />
          <div>
            <h4 className="font-semibold text-foreground text-sm">{name}</h4>
            <p className="text-xs text-muted-foreground">{role}</p>
            <p className="text-xs text-primary font-medium">
              {franchiseNameElement} • {location}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
