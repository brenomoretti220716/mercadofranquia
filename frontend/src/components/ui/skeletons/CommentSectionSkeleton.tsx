import Skeleton from './Skeleton'

export function CommentSectionSkeleton() {
  return (
    <div className="my-10 flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-sm">
      <Skeleton className="h-8 w-72" />

      <div className="flex flex-col gap-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </div>
    </div>
  )
}
