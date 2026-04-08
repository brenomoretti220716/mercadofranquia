'use client'

import Skeleton from './Skeleton'

export default function NewsListSkeleton() {
  return (
    <div className="container pb-12">
      {/* Top row: featured + side list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>

        <div className="w-full flex flex-col justify-between h-full gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex gap-3 p-2 border border-border rounded-xl"
            >
              <Skeleton className="w-24 h-24 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 p-3 border border-border rounded-2xl"
          >
            <Skeleton className="h-32 w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex mt-10 justify-center">
        <Skeleton className="h-9 w-64 rounded-full" />
      </div>
    </div>
  )
}
