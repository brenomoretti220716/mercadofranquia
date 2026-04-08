import Skeleton from './Skeleton'

export function BusinessModelsSkeleton() {
  return (
    <div className="flex flex-col gap-4 my-5">
      <Skeleton className="h-8 w-64" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-gray-200 bg-white p-4"
          >
            <Skeleton className="mb-4 h-48 w-full rounded-xl" />

            <div className="flex flex-col gap-3">
              <Skeleton className="h-6 w-3/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
