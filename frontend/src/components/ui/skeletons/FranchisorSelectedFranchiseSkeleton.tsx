import Skeleton from './Skeleton'

export default function FranchisorSelectedFranchiseSkeleton() {
  return (
    <div className="flex flex-col m-4 sm:m-6 md:m-10 w-auto min-h-screen gap-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Skeleton className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex-shrink-0" />
          <Skeleton className="h-7 sm:h-8 w-56 sm:w-64" />
        </div>
        <Skeleton className="h-7 sm:h-8 w-56 sm:w-80" />
      </div>

      <div className="flex flex-col gap-5">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>

      <div className="flex flex-col md:flex-row gap-5 items-stretch">
        <div className="flex flex-col w-full bg-[#FFFFFF] rounded-2xl">
          <div className="flex flex-col p-4 sm:p-6 md:p-10 gap-5">
            <Skeleton className="h-6 w-64" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>

        <div className="flex flex-col w-full gap-5">
          <div className="flex flex-col w-full min-h-0 md:min-h-[42vh] bg-[#FFFFFF] p-4 sm:p-6 md:p-10 rounded-2xl">
            <Skeleton className="h-6 w-64" />
            <div className="flex flex-col gap-4 mt-5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
          <div className="flex flex-col w-full min-h-0 md:min-h-[42vh] bg-[#FFFFFF] p-4 sm:p-6 md:p-10 rounded-2xl">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-72 mt-2" />
            <div className="flex flex-col gap-4 mt-5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col mt-5">
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    </div>
  )
}
