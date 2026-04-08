'use client'

import { getFranchiseImageUrls } from '@/src/utils/franchiseImageUtils'
import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import ImageLightbox from './ImageLightbox'

interface MediaCarouselProps {
  images: string[]
  fallbackImage: string
  alt: string
  className?: string
}

export default function MediaCarousel({
  images,
  fallbackImage,
  alt,
  className = '',
}: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]))
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRefs = useRef<(HTMLDivElement | null)[]>([])

  const validImages = useMemo(() => getFranchiseImageUrls(images), [images])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1))
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setIsLightboxOpen(true)
  }

  const closeLightbox = () => {
    setIsLightboxOpen(false)
  }

  const goToPreviousLightbox = () => {
    setLightboxIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1))
  }

  const goToNextLightbox = () => {
    setLightboxIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1))
  }

  // Lazy loading with IntersectionObserver
  useEffect(() => {
    // Only set up observers if we have multiple images
    if (validImages.length <= 1) {
      return
    }

    if (!('IntersectionObserver' in window)) {
      // Fallback: load all images if IntersectionObserver not supported
      setLoadedImages(new Set(validImages.map((_, i) => i)))
      return
    }

    const observers: IntersectionObserver[] = []

    imageRefs.current.forEach((ref, index) => {
      if (!ref) return

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setLoadedImages((prev) => new Set([...prev, index]))
              // Preload next image
              const nextIndex = (index + 1) % validImages.length
              setLoadedImages((prev) => new Set([...prev, nextIndex]))
              observer.disconnect()
            }
          })
        },
        { rootMargin: '200px' },
      )

      observer.observe(ref)
      observers.push(observer)
    })

    return () => {
      observers.forEach((observer) => observer.disconnect())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validImages.length])

  // If no valid images, show fallback
  if (validImages.length === 0) {
    return (
      <figure
        className={`relative flex w-full h-[45vh] rounded-2xl overflow-hidden ${className}`}
      >
        <Image
          alt={alt}
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

  // If only one image, no need for carousel
  if (validImages.length === 1) {
    return (
      <>
        <figure
          className={`relative flex w-full h-[45vh] rounded-2xl overflow-hidden cursor-pointer ${className}`}
          onClick={() => openLightbox(0)}
        >
          <Image
            alt={alt}
            src={validImages[0]}
            width={1000}
            height={1000}
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="h-full w-full rounded-lg object-cover"
          />
        </figure>
        <ImageLightbox
          images={validImages}
          currentIndex={lightboxIndex}
          isOpen={isLightboxOpen}
          onClose={closeLightbox}
          onPrevious={goToPreviousLightbox}
          onNext={goToNextLightbox}
          alt={alt}
        />
      </>
    )
  }

  return (
    <figure
      className={`relative flex w-full h-[45vh] rounded-2xl justify-center overflow-hidden ${className}`}
      ref={containerRef}
    >
      {/* Images container */}
      <div className="relative w-full h-full">
        {validImages.map((imageUrl, index) => (
          <div
            key={`${imageUrl}-${index}`}
            ref={(el) => {
              imageRefs.current[index] = el
            }}
            className={`absolute inset-0 transition-opacity duration-300 cursor-pointer ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            onClick={() => openLightbox(index)}
          >
            {loadedImages.has(index) ? (
              <Image
                alt={`${alt} - Imagem ${index + 1}`}
                src={imageUrl}
                width={1000}
                height={1000}
                priority={index === 0}
                loading={index === 0 ? undefined : 'lazy'}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 animate-pulse rounded-lg" />
            )}
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      <button
        type="button"
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Imagem anterior"
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
        aria-label="Próxima imagem"
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
      {validImages.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {validImages.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Ir para imagem ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        images={validImages}
        currentIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={closeLightbox}
        onPrevious={goToPreviousLightbox}
        onNext={goToNextLightbox}
        alt={alt}
      />
    </figure>
  )
}
