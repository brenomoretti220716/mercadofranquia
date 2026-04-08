'use client'

import { useMemo } from 'react'

import BottomNewsList from './components/BottomNewsList'
import { useNews } from '@/src/hooks/news/useNews'

const DEFAULT_LIMIT = 8

export default function HomeBottomNews() {
  const { data } = useNews({ page: 1, limit: DEFAULT_LIMIT })

  const bottomNews = useMemo(() => {
    const items = (data?.items ?? []).filter((item) => Boolean(item?.id))
    return items.slice(4, 8)
  }, [data?.items])

  if (bottomNews.length === 0) {
    return null
  }

  return (
    <section className="mt-10 flex flex-col gap-4">
      <h3 className="text-2xl font-semibold text-gray-900">
        Mais notícias para você
      </h3>
      <BottomNewsList
        items={bottomNews}
        className="flex flex-col gap-4 sm:gap-6"
      />
    </section>
  )
}
