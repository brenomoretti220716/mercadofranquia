import Skeleton from './Skeleton'

export default function LoginModalSkeleton() {
  return (
    <div className="flex flex-col bg-white relative w-full h-auto rounded-lg overflow-hidden p-10">
      {/* Header */}
      <div className="mb-6">
        <Skeleton className="w-32 h-6 mb-2" />
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Email Field */}
        <div className="flex flex-col">
          <Skeleton className="w-full h-10 rounded-sm" />
        </div>

        {/* Password Field */}
        <div className="flex flex-col">
          <Skeleton className="w-full h-10 rounded-sm" />
        </div>

        {/* Button */}
        <div className="mt-6">
          <Skeleton className="w-full h-10 rounded-sm" />
        </div>
      </div>
    </div>
  )
}
