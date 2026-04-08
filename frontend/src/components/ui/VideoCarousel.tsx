'use client'

import { normalizeVideoUrls } from '@/src/utils/franchiseImageUtils'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import LazyYouTubeEmbed from './LazyYouTubeEmbed'

interface VideoCarouselProps {
  videos: string[] | string | null | undefined
  posterSrc?: string | null
  title: string
  fallbackImage: string
  className?: string
}

export default function VideoCarousel({
  videos,
  posterSrc,
  title,
  fallbackImage,
  className = '',
}: VideoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Normalize videos to always be an array and filter out invalid entries
  const validVideos = useMemo(() => {
    const normalized = normalizeVideoUrls(videos)
    return normalized.filter((video): video is string =>
      Boolean(video && video.trim()),
    )
  }, [videos])

  // If no valid videos, show fallback image
  if (validVideos.length === 0) {
    return (
      <figure
        className={`relative flex w-full h-[45vh] rounded-2xl overflow-hidden ${className}`}
      >
        <Image
          alt={title}
          src={fallbackImage}
          width={1000}
          height={1000}
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="h-full w-full rounded-lg object-cover"
        />
      </figure>
    )
  }

  // If only one video, no need for carousel
  if (validVideos.length === 1) {
    return (
      <LazyYouTubeEmbed
        videoUrl={validVideos[0]}
        title={title}
        className={`h-[45vh] ${className}`}
        posterSrc={posterSrc}
        posterAlt={title}
      />
    )
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? validVideos.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === validVideos.length - 1 ? 0 : prev + 1))
  }

  return (
    <div
      className={`relative flex w-full h-[45vh] rounded-2xl overflow-hidden ${className}`}
    >
      {/* Videos container */}
      <div className="relative w-full h-full">
        {validVideos.map((videoUrl, index) => (
          <div
            key={`${videoUrl}-${index}`}
            className={`absolute inset-0 transition-opacity duration-300 ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <LazyYouTubeEmbed
              videoUrl={videoUrl}
              title={`${title} - Vídeo ${index + 1}`}
              className="h-full w-full"
              posterSrc={index === 0 ? posterSrc : undefined}
              posterAlt={title}
            />
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      <button
        type="button"
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Vídeo anterior"
      >
        <svg
          className="w-6 h-6 text-gray-800"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <button
        type="button"
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Próximo vídeo"
      >
        <svg
          className="w-6 h-6 text-gray-800"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Indicators */}
      {validVideos.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {validVideos.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Ir para vídeo ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
