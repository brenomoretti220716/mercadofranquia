'use client'

import Skeleton from './Skeleton'

export default function AdminUsersTableSkeleton() {
  return (
    <div className="flex m-10 w-auto flex-col">
      <div className="flex flex-row justify-between items-center my-5">
        <div className="w-[40vw]">
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="rounded-sm bg-[#E25E3E] h-10" />
      <div className="overflow-x-auto mt-2">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between border-b border-gray-200 py-3 px-4"
          >
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-6" />
          </div>
        ))}
      </div>
    </div>
  )
}
