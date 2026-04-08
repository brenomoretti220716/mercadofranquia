'use client'

import Skeleton from './Skeleton'

export default function SelectedNewsSkeleton() {
  return (
    <div className="w-auto h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <article className="w-auto rounded-2xl py-[8vh] bg-[#FFFFFF] max-w-full overflow-hidden">
          {/* Header skeleton */}
          <div className="flex px-[10vw]">
            <header className="mb-8 w-full">
              <Skeleton className="h-12 w-3/4 mb-6" />
              <Skeleton className="h-8 w-full mb-6" />
              <Skeleton className="h-8 w-2/3 mb-4" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-6 w-32 des-6" />
                <Skeleton className="h-4 w-48" />
              </div>
            </header>
          </div>

          {/* Image skeleton */}
          <div className="mb-10 flex justify-center p-10">
            <Skeleton className="w-full max-w-[1550px] h-[600px] rounded-lg" />
          </div>

          {/* Content skeleton */}
          <div className="prose prose-lg max-w-none mb-12 px-[10vw]">
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
