'use client'

import Image from 'next/image'
import Link from 'next/link'
import RoundedButton from '../../ui/RoundedButton'
import { useNews } from '@/src/hooks/news/useNews'
import { formatDateToBrazilian } from '@/src/utils/dateFormatters'
import { generateSlug } from '@/src/utils/generateSlug'
import { useCallback } from 'react'

export default function BannerNews() {
  const { data } = useNews({ page: 1, limit: 1 })
  const news = data?.items || []
  const latestNews = news[0]

  const getImageUrl = useCallback((photoUrl: string | undefined): string => {
    if (!photoUrl) return '/assets/news.jpg'
    if (photoUrl.startsWith('http')) {
      return photoUrl
    }
    return `${process.env.NEXT_PUBLIC_API_URL}/uploads/news/${photoUrl}`
  }, [])

  if (!latestNews || !latestNews.id) {
    return (
      <div className="flex flex-col h-full">
        <div className="relative w-full h-64 md:h-full rounded-md overflow-hidden mb-5">
          <Image
            src="/assets/news.jpg"
            alt="News banner"
            fill
            className="object-cover z-0 opacity-100"
          />
        </div>
        <div className="flex-shrink-0">
          <p className="text-gray-500">Nenhuma notícia disponível</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="relative w-full h-64 md:h-full rounded-md overflow-hidden mb-5">
        <Link
          href={`/noticias/${generateSlug(latestNews.title || '', latestNews.id)}`}
        >
          <Image
            src={getImageUrl(latestNews.photoUrl)}
            alt={latestNews.title || 'News banner'}
            fill
            className="object-cover z-0 opacity-100 cursor-pointer hover:opacity-90 transition-opacity"
          />
        </Link>
      </div>
      <div className="flex-shrink-0">
        <div className="mb-3">
          <h4 className="font-manrope font-semibold">{latestNews.category}</h4>
          <h4 className="font-manrope font-normal">
            {formatDateToBrazilian(latestNews.createdAt)}
          </h4>
        </div>

        <div className="flex flex-col gap-5 mb-5">
          <Link
            href={`/noticias/${generateSlug(latestNews.title || '', latestNews.id)}`}
          >
            <h3 className="font-manrope font-bold text-2xl lg:text-3xl hover:text-orange-600 cursor-pointer transition-colors">
              {latestNews.title}
            </h3>
          </Link>
          <h4 className="text-lg lg:text-xl">{latestNews.summary}</h4>
        </div>

        <div className="flex">
          <Link
            href={`/noticias/${generateSlug(latestNews.title || '', latestNews.id)}`}
          >
            <RoundedButton color="#E25E3E" text="Ler mais" textColor="white" />
          </Link>
        </div>
      </div>
    </div>
  )
}
