'use client'

import Skeleton from './Skeleton'

export default function FranchiseDataEditSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Skeleton className="h-9 w-48" />
        <div className="flex gap-3 w-full sm:w-auto">
          <Skeleton className="h-10 w-full sm:w-32 rounded-full" />
          <Skeleton className="h-10 w-full sm:w-32 rounded-full" />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-5 items-stretch">
        {/* Card Principal */}
        <div className="flex flex-col w-full bg-[#FFFFFF] rounded-2xl">
          <div className="flex flex-col p-4 sm:p-6 md:p-10 gap-5">
            <Skeleton className="h-6 w-64" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>

        {/* SideCard */}
        <div className="flex flex-col w-full gap-5">
          {/* SideCard Top */}
          <div className="flex flex-col w-full bg-[#FFFFFF] p-4 sm:p-6 md:p-10 rounded-2xl">
            <Skeleton className="h-6 w-64 mb-5" />
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex flex-col gap-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex flex-col gap-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>

          {/* SideCard Bottom */}
          <div className="flex flex-col w-full bg-[#FFFFFF] p-4 sm:p-6 md:p-10 rounded-2xl">
            <div className="flex flex-col mb-5">
              <Skeleton className="h-6 w-64 mb-2" />
              <Skeleton className="h-4 w-72" />
            </div>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex flex-col gap-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex flex-col gap-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
