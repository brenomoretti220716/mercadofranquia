'use client'

import Skeleton from './Skeleton'

interface ReviewsSectionSkeletonProps {
  cards?: number
}

export default function ReviewsSectionSkeleton({
  cards = 3,
}: ReviewsSectionSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: cards }).map((_, index) => (
        <div
          key={index}
          className="bg-card rounded-2xl p-6 border border-border shadow-sm relative"
        >
          {/* Quoted text + quote icon placeholder */}
          <div className="mb-6 relative">
            <Skeleton className="h-20 w-full rounded-lg bg-muted" />
            <div className="absolute top-2 right-2">
              <Skeleton className="w-8 h-8 rounded-full bg-muted" />
            </div>
          </div>

          {/* Stars row */}
          <div className="flex gap-1 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="w-4 h-4 rounded-full bg-muted" />
            ))}
          </div>

          {/* Avatar + name / franchise */}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <Skeleton className="w-12 h-12 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-3/4 bg-muted" />
              <Skeleton className="h-3 w-2/3 bg-muted" />
            </div>
          </div>

          {/* Date row */}
          <div className="flex justify-end items-center gap-3 pt-4">
            <Skeleton className="h-3 w-20 bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
