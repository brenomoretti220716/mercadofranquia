'use client'

import { useEffect, useRef, useState } from 'react'

import { convertToEmbedUrl } from '@/src/utils/youtubeUtils'

interface LazyYouTubeEmbedProps {
  videoUrl: string
  title: string
  className?: string
  posterSrc?: string | null
  posterAlt?: string
}

export default function LazyYouTubeEmbed({
  videoUrl,
  title,
  className = '',
  posterSrc,
}: LazyYouTubeEmbedProps) {
  const [shouldLoad, setShouldLoad] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handlePrefetch = () => setShouldLoad(true)

    const current = containerRef.current
    if (!current) {
      return handlePrefetch()
    }

    if (!('IntersectionObserver' in window)) {
      return handlePrefetch()
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true)
            observer.disconnect()
          }
        })
      },
      { rootMargin: '200px' },
    )

    observer.observe(current)

    return () => observer.disconnect()
  }, [])

  if (shouldLoad) {
    return (
      <iframe
        src={convertToEmbedUrl(videoUrl)}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        className={`flex w-full rounded-2xl ${className}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex w-full overflow-hidden rounded-2xl bg-gray-200 ${className}`}
    >
      {posterSrc ? (
        <div className="bg-gray-200 w-full h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-transparent border-b-transparent border-l-transparent border-[#E25E3E]"></div>
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300">
          <span className="font-medium text-gray-500">
            Clique para carregar o vídeo
          </span>
        </div>
      )}
    </div>
  )
}
