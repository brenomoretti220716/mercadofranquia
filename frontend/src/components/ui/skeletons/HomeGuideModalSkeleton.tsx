'use client'

import Skeleton from './Skeleton'

export default function HomeGuideModalSkeleton() {
  return (
    <>
      <div className="flex-col bg-white relative w-full h-auto overflow-hidden p-10 mt-5 rounded-lg">
        <div className="mb-5 text-xl font-bold">
          <Skeleton className="w-full h-4" />
        </div>

        <div className="flex flex-col">
          <a
            href=""
            className="flex justify-between border-b border-[#d3d3d3] py-5"
          >
            <Skeleton className="w-full h-4" />
          </a>
          <a
            href=""
            className="flex justify-between border-b border-[#d3d3d3] py-5"
          >
            <Skeleton className="w-full h-4" />
          </a>
          <a
            href=""
            className="flex justify-between border-b border-[#d3d3d3] py-5"
          >
            <Skeleton className="w-full h-4" />
          </a>
        </div>
      </div>
    </>
  )
}
