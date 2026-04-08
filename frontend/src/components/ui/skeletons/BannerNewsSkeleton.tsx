'use client'

import Skeleton from './Skeleton'

export default function BannerNewsSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="relative w-full h-64 md:h-full rounded-md overflow-hidden mb-5">
        <Skeleton className="w-full h-full" />
      </div>
      <div className="flex-shrink-0">
        <div className="mb-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>

        <div className="flex flex-col gap-5 mb-5">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>

        <div className="flex">
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
      </div>
    </div>
  )
}
