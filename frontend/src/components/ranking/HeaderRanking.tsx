'use client'

import HeartIcon from '@/src/components/icons/heartIcon'
import { Franchise } from '@/src/schemas/franchises/Franchise'
import Image from 'next/image'
import Link from 'next/link'

interface HeaderRankingProps {
  franchise: Franchise
  nextFranchise: string | null
  previousFranchise: string | null
  isFavorited?: boolean
  onFavoriteClick?: () => void
  isLoading?: boolean
  buildUrl?: (basePath: string) => string
}

export default function HeaderRanking({
  franchise,
  nextFranchise,
  previousFranchise,
  isFavorited,
  onFavoriteClick,
  isLoading,
  buildUrl,
}: HeaderRankingProps) {
  const getUrl = (franchiseSlug: string) => {
    const basePath = `/ranking/${franchiseSlug}`
    return buildUrl ? buildUrl(basePath) : basePath
  }

  const handleHeartClick = () => {
    if (isLoading) return
    onFavoriteClick?.()
  }

  return (
    <div className="flex flex-col-reverse md:flex-row items-center justify-between m-4 sm:m-5 md:m-10 gap-4 md:gap-0">
      <div className="flex items-center gap-3 sm:gap-4 md:gap-5">
        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-15 md:h-15 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
          {franchise.logoUrl ? (
            <Image
              src={franchise.logoUrl}
              alt={franchise.name || 'Franchise'}
              width={1000}
              height={1000}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                target.nextElementSibling?.classList.remove('hidden')
              }}
            />
          ) : null}
          <div
            className={`w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-semibold ${franchise.logoUrl ? 'hidden' : ''}`}
          >
            {franchise.name ? franchise.name.charAt(0).toUpperCase() : 'F'}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 font-semibold text-lg sm:text-xl md:text-2xl lg:text-3xl">
          <h1 className="break-words">{`#${franchise?.rankingPosition || '?'} ${franchise.name}`}</h1>
          {onFavoriteClick && (
            <button
              onClick={handleHeartClick}
              disabled={isLoading}
              className="flex-shrink-0 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E25E3E] focus-visible:ring-offset-2 rounded-full p-0.5"
              aria-label={
                isFavorited
                  ? 'Remover dos favoritos'
                  : 'Adicionar aos favoritos'
              }
              aria-busy={isLoading}
            >
              <span
                className={`inline-block transition-transform duration-300 ease-out ${isLoading ? 'animate-bounce' : ''}`}
              >
                <HeartIcon
                  fill={isFavorited ? '#E25E3E' : 'none'}
                  className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 transition-colors duration-200 ${isFavorited ? 'text-[#E25E3E]' : 'text-gray-400 hover:text-[#E25E3E]'} cursor-pointer`}
                />
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-between w-full md:w-auto md:justify-end gap-3 md:gap-5">
        {previousFranchise !== null && (
          <Link href={getUrl(previousFranchise)}>
            <button className="rounded-full border-2 border-border px-5 py-3 md:px-8 md:py-4 text-base md:text-lg font-medium text-[#171726] hover:border-[#E25F3E] hover:text-[#E25F3E] transition-colors cursor-pointer">
              Anterior
            </button>
          </Link>
        )}

        {nextFranchise !== null && (
          <Link href={getUrl(nextFranchise)}>
            <button className="rounded-full border-2 border-border px-5 py-3 md:px-8 md:py-4 text-base md:text-lg font-medium text-[#171726] hover:border-[#E25F3E] hover:text-[#E25F3E] transition-colors cursor-pointer">
              Próximo
            </button>
          </Link>
        )}
      </div>
    </div>
  )
}
