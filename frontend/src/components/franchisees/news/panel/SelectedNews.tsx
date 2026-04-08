'use client'

import NewsComments from '@/src/components/franchisees/news/components/NewsComments'
import { NewsSchema } from '@/src/schemas/users/News'
import { formatDateTimeToBrazilian } from '@/src/utils/dateFormatters'
import Image from 'next/image'
import { useState } from 'react'

interface SelectedNewsProps {
  news: NewsSchema
}

export default function SelectedNews({ news }: SelectedNewsProps) {
  const [hasError, setHasError] = useState(false)

  // Função para obter URL da imagem
  function getImageUrl(photoUrl: string | undefined): string {
    if (!photoUrl) return '/banner.jpg'

    if (photoUrl.startsWith('http')) {
      return photoUrl
    }

    return `${process.env.NEXT_PUBLIC_API_URL}/uploads/news/${photoUrl}`
  }

  // Função para formatar data (imported from utils)
  const formatDate = formatDateTimeToBrazilian

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true)
    }
  }

  return (
    <article className="w-auto rounded-2xl py-[8vh] bg-[#FFFFFF] max-w-full overflow-hidden">
      {/* Header da notícia */}
      <div className="flex px-[10vw]">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight break-words hyphens-auto">
            {news.title}
          </h1>

          {news.summary && (
            <p className="text-xl text-gray-600 leading-relaxed mb-6 font-medium break-words">
              {news.summary}
            </p>
          )}

          <div className="flex flex-col gap-2 text-sm text-black mb-4">
            <span className="rounded-full text-xl font-bold break-words">
              {news.category}
            </span>
            <time className="break-words">{formatDate(news.createdAt)}</time>
          </div>
        </header>
      </div>

      {/* Imagem principal */}
      {news.photoUrl && (
        <figure className="mb-10 flex justify-center px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="relative w-full max-h-[70vh] overflow-hidden rounded-lg">
            <Image
              src={getImageUrl(news.photoUrl)}
              alt={news.title || 'Imagem da notícia'}
              width={1200}
              height={800}
              className="rounded-lg object-cover w-full h-full max-h-[70vh]"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 95vw, 1200px"
              onError={handleImageError}
            />
          </div>
        </figure>
      )}

      {/* Conteúdo da notícia */}
      <div className="prose prose-lg max-w-none mb-12 px-[10vw]">
        <div
          className="text-gray-800 leading-relaxed break-words overflow-wrap-anywhere"
          dangerouslySetInnerHTML={{ __html: news.content || '' }}
          style={{
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            hyphens: 'auto',
          }}
        />
      </div>

      {/* Seção de Comentários */}
      {news.id && <NewsComments newsId={news.id} />}
    </article>
  )
}
