import Skeleton from './Skeleton'

export default function RegisterModalSkeleton() {
  return (
    <div className="flex flex-col w-full h-auto">
      {/* Step Indicator */}
      <div className="flex justify-center items-center gap-2 mb-6">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="w-12 h-0.5" />
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>

      {/* Header */}
      <div className="mb-6 text-center">
        <Skeleton className="w-48 h-6 mb-2 mx-auto" />
        <Skeleton className="w-64 h-4 mx-auto" />
      </div>

      {/* Form */}
      <div className="space-y-3 sm:space-y-4">
        {/* Name Field */}
        <div className="flex flex-col">
          <Skeleton className="w-full h-10 rounded-sm" />
        </div>

        {/* Email Field */}
        <div className="flex flex-col">
          <Skeleton className="w-full h-10 rounded-sm" />
        </div>

        {/* Phone Field */}
        <div className="flex flex-col">
          <Skeleton className="w-full h-10 rounded-sm" />
        </div>

        {/* Password Field */}
        <div className="flex flex-col">
          <Skeleton className="w-full h-10 rounded-sm" />
        </div>

        {/* Confirm Password Field */}
        <div className="flex flex-col">
          <Skeleton className="w-full h-10 rounded-sm" />
        </div>

        {/* Button */}
        <div className="mt-8">
          <Skeleton className="w-full h-10 rounded-sm" />
        </div>

        {/* Link */}
        <div className="flex justify-center mt-4">
          <Skeleton className="w-32 h-4" />
        </div>
      </div>
    </div>
  )
}
