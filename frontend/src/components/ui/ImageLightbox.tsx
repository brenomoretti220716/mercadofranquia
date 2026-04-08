'use client'

import Image from 'next/image'
import { useEffect } from 'react'

interface ImageLightboxProps {
  images: string[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
  alt: string
}

export default function ImageLightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onPrevious,
  onNext,
  alt,
}: ImageLightboxProps) {
  // Handle keyboard navigation - must be called before any early returns
  useEffect(() => {
    if (!isOpen || images.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        onPrevious()
      } else if (e.key === 'ArrowRight') {
        onNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, images.length, onClose, onPrevious, onNext])

  if (!isOpen || images.length === 0) return null

  const currentImage = images[currentIndex]

  return (
    <>
      {/* Background overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Lightbox container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={`Visualização de imagem ${currentIndex + 1} de ${images.length}`}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-[60] bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 text-gray-800 pointer-events-auto"
            aria-label="Fechar visualização"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Previous button */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={onPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-[60] bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-200 text-gray-800 pointer-events-auto"
              aria-label="Imagem anterior"
            >
              <svg
                className="w-6 h-6"
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
          )}

          {/* Next button */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-[60] bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-200 text-gray-800 pointer-events-auto"
              aria-label="Próxima imagem"
            >
              <svg
                className="w-6 h-6"
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
          )}

          {/* Image */}
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={currentImage}
              alt={`${alt} - Imagem ${currentIndex + 1} de ${images.length}`}
              width={1920}
              height={1080}
              className="max-w-full max-h-full object-contain rounded-lg"
              priority
              sizes="100vw"
            />
          </div>

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[60] bg-black/50 text-white px-4 py-2 rounded-full text-sm pointer-events-auto">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
