'use client'

import Skeleton from './Skeleton'

export default function MercadoPageSkeleton() {
  const cardClass =
    'bg-card rounded-2xl border border-border p-6 md:p-8 min-h-[200px]'

  return (
    <div className="space-y-6">
      {/* Header — title + description + quarter explainer */}
      <div className="text-center space-y-4">
        <div>
          <Skeleton className="h-8 w-64 mx-auto mb-2 md:h-9 md:w-72" />
          <Skeleton className="h-5 w-96 mx-auto max-w-full md:w-[28rem]" />
        </div>
        <div className="mx-auto max-w-2xl border border-border rounded-lg px-4 py-3 text-left space-y-2">
          <Skeleton className="h-3 w-full max-w-xl" />
          <Skeleton className="h-3 w-full max-w-lg" />
          <Skeleton className="h-3 w-full max-w-md" />
        </div>
      </div>

      {/* Row 1 — full width chart card */}
      <div className={cardClass}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-72" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex gap-3 shrink-0">
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-28 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>

      {/* Row 2 — 2 col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={cardClass}>
          <div className="space-y-2 mb-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-[240px] w-full rounded-lg" />
        </div>
        <div className={cardClass}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
            <div className="space-y-2">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-2 shrink-0">
              <Skeleton className="h-10 w-28 rounded-md" />
              <Skeleton className="h-10 w-48 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-[240px] w-full rounded-lg" />
        </div>
      </div>

      {/* Full width — segment evolution comparison */}
      <div className={cardClass}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-6">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
          <Skeleton className="h-10 w-28 rounded-md shrink-0" />
        </div>
        <Skeleton className="h-16 w-full rounded-lg mb-6" />
        <Skeleton className="h-[380px] w-full rounded-lg" />
      </div>

      {/* Row 3 — 2 col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={cardClass}>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between mb-6">
            <div className="space-y-2">
              <Skeleton className="h-6 w-52" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-28 rounded-md" />
          </div>
          <Skeleton className="h-[280px] w-full rounded-full max-w-[280px] mx-auto" />
        </div>
        <div className={cardClass}>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between mb-6">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-10 w-28 rounded-md" />
          </div>
          <Skeleton className="h-[280px] w-full rounded-lg" />
        </div>
      </div>

      {/* Row 4 — full width */}
      <div className={cardClass}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-10 w-28 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-[280px] w-full rounded-lg" />
      </div>
    </div>
  )
}
