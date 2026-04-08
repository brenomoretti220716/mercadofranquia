'use client'

import Skeleton from './Skeleton'

export default function AdminSelectedFranchiseSkeleton() {
  return (
    <div className="flex flex-col m-4 sm:m-5 md:m-10 w-auto min-h-screen gap-4 md:gap-5">
      <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-4 md:gap-0">
        <div className="flex items-center gap-3 sm:gap-4 md:gap-5">
          <Skeleton className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full" />
          <Skeleton className="h-6 sm:h-7 md:h-8 w-48 sm:w-56 md:w-64" />
        </div>
        <div className="flex justify-between w-full md:w-auto md:justify-end gap-3 md:gap-5">
          <Skeleton className="h-9 md:h-10 w-24 md:w-28 rounded-sm" />
          <Skeleton className="h-9 md:h-10 w-24 md:w-28 rounded-sm" />
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-4 md:gap-5">
        <Skeleton className="w-full h-[40vh] sm:h-[45vh] rounded-2xl" />
        <Skeleton className="w-full h-[40vh] sm:h-[45vh] rounded-2xl" />
      </div>
      <div className="flex flex-col md:flex-row gap-4 md:gap-5 items-stretch">
        <div className="flex flex-col w-full bg-[#FFFFFF] rounded-2xl">
          <div className="flex flex-col p-5 sm:p-6 md:p-10 gap-4 md:gap-5">
            <Skeleton className="h-6 sm:h-7 md:h-8 w-3/4 sm:w-2/3 md:w-1/2" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-5 sm:h-6 w-1/2 sm:w-2/5" />
                <Skeleton className="h-4 sm:h-5 w-3/4 sm:w-2/3" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col w-full gap-4 md:gap-5">
          <div className="flex flex-col w-full bg-[#FFFFFF] rounded-2xl p-5 sm:p-6 md:p-10">
            <Skeleton className="h-6 sm:h-7 md:h-8 w-2/3 sm:w-1/2 mb-4 md:mb-5" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 mt-4 md:mt-5">
                <Skeleton className="h-5 sm:h-6 w-1/2 sm:w-2/5" />
                <Skeleton className="h-4 sm:h-5 w-3/4 sm:w-2/3" />
              </div>
            ))}
          </div>
          <div className="flex flex-col w-full bg-[#FFFFFF] rounded-2xl p-5 sm:p-6 md:p-10">
            <Skeleton className="h-6 sm:h-7 md:h-8 w-2/3 sm:w-1/2 mb-4 md:mb-5" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 mt-4 md:mt-5">
                <Skeleton className="h-5 sm:h-6 w-1/2 sm:w-2/5" />
                <Skeleton className="h-4 sm:h-5 w-3/4 sm:w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
