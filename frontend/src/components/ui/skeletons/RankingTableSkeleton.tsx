'use client'

import Skeleton from './Skeleton'

export default function RankingTableSkeleton() {
  return (
    <div className="space-y-6">
      {/* Card container to match new table style */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {/* Mobile skeleton — simplified list layout */}
        <div className="p-4 space-y-4 md:hidden">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="space-y-2 flex-1 min-w-0">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>

        {/* Desktop skeleton — matches RankingTableView columns */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[6%]" />
              <col className="w-[26%]" />
              <col className="w-[19%]" />
              <col className="w-[15%]" />
              <col className="w-[17%]" />
              <col className="w-[17%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left p-4">
                  <Skeleton className="h-4 w-4" />
                </th>
                <th className="text-left p-4">
                  <Skeleton className="h-4 w-24" />
                </th>
                <th className="text-center p-4">
                  <Skeleton className="h-4 w-20 mx-auto" />
                </th>
                <th className="text-center p-4">
                  <Skeleton className="h-4 w-20 mx-auto" />
                </th>
                <th className="text-center p-4">
                  <Skeleton className="h-4 w-20 mx-auto" />
                </th>
                <th className="text-center p-4">
                  <Skeleton className="h-4 w-24 mx-auto" />
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, idx) => (
                <tr key={idx} className="border-b border-border last:border-0">
                  <td className="p-4 text-center">
                    <Skeleton className="h-8 w-8 rounded-full mx-auto" />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </td>
                  <td className="p-4 text-center">
                    <Skeleton className="h-4 w-20 mx-auto" />
                  </td>
                  <td className="p-4 text-center">
                    <Skeleton className="h-4 w-16 mx-auto" />
                  </td>
                  <td className="p-4 text-center">
                    <Skeleton className="h-4 w-28 mx-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination skeleton to match new centered controls */}
      <div className="flex justify-center">
        <Skeleton className="h-9 w-64 rounded-full" />
      </div>
    </div>
  )
}
