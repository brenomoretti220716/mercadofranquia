'use client'

import Skeleton from './Skeleton'

export default function PerfilPageSkeleton() {
  return (
    <div className="mx-auto max-w-4xl">
      {/* Header Section */}
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-3" />
        <Skeleton className="h-5 w-80" />
      </div>

      {/* Accordions */}
      <div className="space-y-4">
        {/* First Accordion */}
        <div className="border border-gray-200 rounded-lg">
          <div className="w-full flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>

        {/* Second Accordion */}
        <div className="border border-gray-200 rounded-lg">
          <div className="w-full flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>

        {/* Third Accordion (optional) */}
        <div className="border border-gray-200 rounded-lg">
          <div className="w-full flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
