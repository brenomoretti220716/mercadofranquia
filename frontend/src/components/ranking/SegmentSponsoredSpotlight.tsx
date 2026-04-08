'use client'

import { franchiseQueries } from '@/src/queries/franchises'
import type { SponsorPlacement } from '@/src/schemas/franchises/Franchise'
import { formatInvestmentRange } from '@/src/utils/formatters'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

interface SegmentSponsoredSpotlightProps {
  segment: string
  subsegment?: string
  excludeSubsegment?: string
  placement: SponsorPlacement
  title: string
  limit?: number
}

function shuffleIds<T>(items: T[]) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function SegmentSponsoredSpotlight({
  segment,
  subsegment,
  excludeSubsegment,
  placement,
  title,
  limit = 10,
}: SegmentSponsoredSpotlightProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const { data, isLoading } = useQuery(
    franchiseQueries.paginated({
      page: 1,
      limit,
      isSponsored: true,
      segment,
      subsegment,
      excludeSubsegment,
    }),
  )

  const sponsoredByPlacement = useMemo(() => {
    const list = data?.data ?? []
    const filtered = list.filter((franchise) => {
      if (!Array.isArray(franchise.sponsorPlacements)) return false
      return franchise.sponsorPlacements.includes(placement)
    })
    return shuffleIds(filtered)
  }, [data?.data, placement])

  useEffect(() => {
    setActiveIndex(0)
  }, [segment, subsegment, excludeSubsegment, placement])

  useEffect(() => {
    if (sponsoredByPlacement.length <= 1) return

    const intervalId = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % sponsoredByPlacement.length)
    }, 4000)

    return () => window.clearInterval(intervalId)
  }, [sponsoredByPlacement.length])

  const visibleCards = useMemo(() => {
    if (sponsoredByPlacement.length === 0) return []
    const cardsToShow = Math.min(3, sponsoredByPlacement.length)
    return Array.from({ length: cardsToShow }).map((_, offset) => {
      const index = (activeIndex + offset) % sponsoredByPlacement.length
      return sponsoredByPlacement[index]
    })
  }, [activeIndex, sponsoredByPlacement])

  if (isLoading || visibleCards.length === 0) {
    return null
  }

  return (
    <section className="mb-8 space-y-3">
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleCards.map((franchise) => (
          <Link
            key={franchise.id}
            href={`/ranking/${franchise.slug ?? franchise.id}`}
            className="h-full rounded-2xl border border-[#E25E3E]/40 bg-[#E25E3E]/5 p-4 transition-colors hover:bg-[#E25E3E]/10"
          >
            <div className="flex h-full items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center overflow-hidden shrink-0">
                {franchise.logoUrl ? (
                  <Image
                    src={franchise.logoUrl}
                    alt={franchise.name}
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                ) : (
                  <span className="text-xl">🏢</span>
                )}
              </div>
              <div className="min-w-0 flex flex-1 flex-col">
                <p className="font-semibold text-foreground truncate leading-tight">
                  {franchise.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {franchise.segment || segment}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Investimento:{' '}
                  {formatInvestmentRange(
                    franchise.minimumInvestment,
                    franchise.maximumInvestment,
                  )}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
