import Image from 'next/image'
import Link from 'next/link'

interface FranchiseCategoryCardProps {
  slug: string
  name: string
  logoUrl?: string | null
  thumbnailUrl?: string | null
  className?: string
}

const FranchiseCategoryCard = ({
  slug,
  name,
  logoUrl,
  thumbnailUrl,
  className,
}: FranchiseCategoryCardProps) => {
  const imageUrl = logoUrl || thumbnailUrl
  const href = `/ranking/${slug}`

  return (
    <Link
      href={href}
      className={`flex-shrink-0 w-[180px] block ${className ?? ''}`}
    >
      {/* Image Container */}
      <div className="w-full aspect-square bg-secondary rounded-xl border border-border overflow-hidden mb-3 flex items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            width={180}
            height={180}
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="text-5xl">🏢</span>
        )}
      </div>

      {/* Franchise Name */}
      <p className="text-sm text-[#171726] dark:text-foreground truncate px-1">
        {name}
      </p>
    </Link>
  )
}

export default FranchiseCategoryCard
