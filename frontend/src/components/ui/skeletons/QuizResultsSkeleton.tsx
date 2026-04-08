'use client'

import Skeleton from './Skeleton'

export default function QuizResultsSkeleton() {
  return (
    <div className="flex justify-center px-2 sm:px-4">
      <div className="w-full max-w-7xl py-4 sm:py-6 space-y-5 sm:space-y-7">
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <Skeleton className="h-6 sm:h-7 w-40 sm:w-48" />
            <Skeleton className="h-10 w-full sm:w-40 rounded-full" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-52 sm:w-64" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-7 w-32 rounded-full" />
              <Skeleton className="h-7 w-40 rounded-full" />
              <Skeleton className="h-7 w-28 rounded-full" />
            </div>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {[0, 1].map((section) => (
            <section key={section}>
              <Skeleton className="h-5 w-48 sm:w-64 mb-3 sm:mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="block rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-border bg-card shadow-sm"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-primary/10">
                        <Skeleton className="h-4 w-6" />
                      </div>
                      <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3 w-28" />
                        <div className="flex items-center gap-3 mt-2">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
