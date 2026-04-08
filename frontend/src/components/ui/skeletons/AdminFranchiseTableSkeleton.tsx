'use client'

import Skeleton from './Skeleton'

export default function AdminFranchiseTableSkeleton() {
  return (
    <div className="flex m-10 w-auto flex-col">
      <div className="flex flex-row justify-between items-center my-5">
        <div className="w-[40vw]">
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-56" />
      </div>

      <div className="rounded-md bg-[#E25E3E]">
        <div className="flex text-white">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="px-4 py-3 text-xs font-black"
              style={{
                width: ['20%', '12%', '15%', '15%', '15%', '15%', '8%'][i],
              }}
            >
              <div className="opacity-0">.</div>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <tbody>
            {Array.from({ length: 8 }).map((_, idx) => (
              <tr key={idx} className="border-b border-gray-200">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </td>
                {Array.from({ length: 5 }).map((_, i) => (
                  <td key={i} className="px-4 py-4 text-center">
                    <Skeleton className="h-4 w-24 inline-block" />
                  </td>
                ))}
                <td className="px-4 py-4 text-center">
                  <Skeleton className="h-4 w-6 inline-block" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
