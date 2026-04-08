export default function BusinessModelDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-10">
      {/* Header skeleton */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Main content skeleton */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
        {/* Image skeleton */}
        <div className="w-full lg:w-1/2">
          <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px] rounded-2xl bg-gray-200 animate-pulse"></div>
        </div>

        {/* Content skeleton */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <div>
            <div className="h-10 sm:h-12 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="w-16 h-1 bg-gray-200 rounded animate-pulse"></div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-2 w-32"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>
            </div>
          </div>

          {/* Metadata skeleton */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
