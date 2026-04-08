'use client'

import Skeleton from './Skeleton'

export default function QuizFlowSkeleton() {
  return (
    <div className="w-full max-w-xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Step indicator skeleton */}
      <div className="flex justify-center items-center gap-1.5 sm:gap-2 overflow-hidden">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="flex items-center flex-shrink-0">
            <Skeleton className="w-7 h-7 sm:w-8 sm:h-8 rounded-full" />
            {index < 6 && (
              <Skeleton className="w-4 sm:w-6 h-1 mx-0.5 sm:mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Form content skeleton */}
      <div className="space-y-4 mt-4">
        <Skeleton className="h-5 w-2/3 max-w-[200px] sm:max-w-none" />
        <Skeleton className="h-4 w-3/4 max-w-[240px] sm:max-w-none" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4">
          <Skeleton className="h-10 w-full rounded-full" />
          <Skeleton className="h-10 w-full rounded-full" />
        </div>
      </div>
    </div>
  )
}
