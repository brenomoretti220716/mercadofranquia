'use client'

import Link from 'next/link'
import Image from 'next/image'

import CalendarIcon from '@/src/components/icons/calendarIcon'
import ClockIcon from '@/src/components/icons/clockIcon'

import { getNewsImageUrl } from './newsImage'

interface TemplateNewsCardProps {
  photoUrl?: string
  title: string
  summary?: string
  date: string
  readTime?: string
  tag?: string
  variant?: 'large' | 'medium' | 'small'
  href?: string
  fallback?: string
}

export default function TemplateNewsCard({
  photoUrl,
  title,
  summary,
  date,
  readTime,
  tag,
  variant = 'small',
  href,
  fallback = '/assets/banner.jpg',
}: TemplateNewsCardProps) {
  const isLarge = variant === 'large'
  const isMedium = variant === 'medium'

  const aspectRatio = isLarge
    ? 'aspect-[16/10]'
    : isMedium
      ? 'aspect-[16/9]'
      : 'aspect-[16/10]'

  const padding = isLarge ? 'p-6' : 'p-4'
  const titleSize = isLarge ? 'text-xl' : 'text-base'
  const summarySize = isLarge ? 'text-base mb-4' : 'text-sm mb-3'

  const cardContent = (
    <article className="news-card cursor-pointer group h-full flex flex-col">
      <div className={`relative overflow-hidden ${aspectRatio}`}>
        <Image
          src={getNewsImageUrl(photoUrl, fallback)}
          alt={title}
          fill
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {tag && (
          <span className="absolute top-4 left-4 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
            {tag}
          </span>
        )}
      </div>
      <div className={`flex flex-col flex-1 ${padding}`}>
        <h3
          className={`font-semibold text-foreground leading-tight mb-2 group-hover:text-primary transition-colors ${titleSize}`}
        >
          {title}
        </h3>
        {summary && (
          <p
            className={`text-muted-foreground line-clamp-2 flex-1 ${summarySize}`}
          >
            {summary}
          </p>
        )}
        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CalendarIcon width={14} height={14} />
            <span className="text-xs">{date}</span>
          </div>
          {readTime && (
            <div className="flex items-center gap-1.5">
              <ClockIcon width={14} height={14} />
              <span className="text-xs">{readTime}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  )

  if (href) {
    return (
      <Link href={href} target="_blank">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}
