'use client'

import SelectedNews from '@/src/components/franchisees/news/panel/SelectedNews'
import RoundedButton from '@/src/components/ui/RoundedButton'
import { useNewsById } from '@/src/hooks/news/useNews'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMemo } from 'react'

function extractIdFromSlug(slug: string): string {
  const cuidRegex = /c[a-z0-9]{24}/i
  const match = slug.match(cuidRegex)

  if (match) {
    return match[0]
  }
  return slug
}

export default function NewsDetailPanel() {
  const params = useParams()

  const newsId = useMemo(() => {
    if (!params.noticia) {
      throw new Error('ID da notícia inválido')
    }
    const slug = Array.isArray(params.noticia)
      ? params.noticia[0]
      : params.noticia
    const id = extractIdFromSlug(slug)
    if (!id) {
      throw new Error('ID da notícia inválido')
    }
    return id
  }, [params.noticia])

  const { data: news } = useNewsById(newsId)

  if (!news.isActive) {
    return (
      <div className="w-auto h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="mb-6">
                <svg
                  className="mx-auto h-16 w-16 text-yellow-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Notícia Indisponível
              </h1>
              <p className="text-gray-600 mb-6">
                Esta notícia foi desativada e não está mais disponível para
                visualização.
              </p>
              <Link href="/noticias">
                <RoundedButton
                  text="Voltar"
                  color="#E25E3E"
                  hoverColor="black"
                  textColor="white"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <SelectedNews news={news} />
}
