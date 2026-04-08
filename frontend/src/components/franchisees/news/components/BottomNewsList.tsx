'use client'

import { NewsSchema } from '@/src/schemas/users/News'
import TemplateNewsCard from './TemplateNewsCard'
import { formatDateToBrazilian } from '@/src/utils/dateFormatters'
import { generateSlug } from '@/src/utils/generateSlug'
import { calculateReadTime, formatReadTime } from '@/src/utils/readTime'

interface BottomNewsListProps {
  items: NewsSchema[]
  className?: string
  targetBlank?: boolean
}

export default function BottomNewsList({
  items,
  className,
}: BottomNewsListProps) {
  const resolveHref = (title: string | undefined, id: string | undefined) =>
    id ? `/noticias/${generateSlug(title || '', id)}` : '#'

  const filteredItems = items.filter((item) => Boolean(item?.id))

  if (filteredItems.length === 0) {
    return null
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((newsItem) => (
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
    </div>
  )
}
