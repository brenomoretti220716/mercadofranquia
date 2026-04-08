'use client'

import Skeleton from './Skeleton'

export default function AdminSponsoredPanelSkeleton() {
  return (
    <div className="m-5 md:m-10 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-44 rounded-md" />
          <Skeleton className="h-8 w-60" />
        </div>
        <Skeleton className="h-5 w-48" />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <Skeleton className="h-4 w-full max-w-[620px]" />
        <Skeleton className="mt-2 h-4 w-full max-w-[560px]" />
      </div>

      <div className="w-full md:w-[40vw]">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="hidden md:grid grid-cols-[minmax(260px,1.2fr)_auto] gap-4 px-4 py-3 border-b border-border bg-muted/40">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-28 justify-self-end" />
        </div>

        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="grid grid-cols-1 md:grid-cols-[minmax(260px,1.2fr)_auto] gap-3 md:gap-4 px-4 py-3 border-b border-border last:border-b-0 items-center"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Skeleton className="w-8 h-8 rounded-md shrink-0" />
              <Skeleton className="h-4 w-44" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(3,minmax(170px,1fr))_auto] gap-2 items-center">
              <Skeleton className="h-8 w-full rounded-md" />
              <Skeleton className="h-8 w-full rounded-md" />
              <Skeleton className="h-8 w-full rounded-md" />
              <div className="md:justify-self-end">
                <Skeleton className="h-9 w-24 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
