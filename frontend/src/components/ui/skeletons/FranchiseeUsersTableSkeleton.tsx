'use client'

import Skeleton from './Skeleton'

export default function FranchiseeUsersTableSkeleton() {
  return (
    <div className="flex m-10 w-auto flex-col">
      <div className="w-[40vw] my-5">
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="rounded-sm bg-[#E25E3E] h-10" />
      <div className="overflow-x-auto mt-2">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between border-b border-gray-200 py-3 px-4"
          >
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-6" />
          </div>
        ))}
      </div>
    </div>
  )
}
