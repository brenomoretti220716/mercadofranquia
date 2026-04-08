'use client'

import Skeleton from './Skeleton'

export default function HomeRankingTableSkeleton() {
  return (
    <div className="flex w-auto flex-col">
      <div className="flex flex-row justify-between items-center mb-5">
        <div className="w-[30vw]">
          <Skeleton className="h-7 w-full" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="bg-[#000000] rounded-lg w-full min-w-[800px]">
          <div className="flex text-white">
            {['10%', '25%', '15%', '15%', '20%'].map((w, i) => (
              <div
                key={i}
                className="px-4 py-3 text-xs font-black"
                style={{ width: w }}
              >
                <div className="opacity-0">.</div>
              </div>
            ))}
          </div>
        </div>

        <table className="w-full text-sm text-left text-gray-500 min-w-[800px]">
          <tbody>
            {Array.from({ length: 8 }).map((_, idx) => (
              <tr key={idx} className="border-b border-gray-200">
                <td className="px-4 py-4 text-center">
                  <Skeleton className="h-5 w-8 inline-block" />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <Skeleton className="h-4 w-16 inline-block" />
                </td>
                <td className="px-4 py-4 text-center">
                  <Skeleton className="h-4 w-24 inline-block" />
                </td>
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
