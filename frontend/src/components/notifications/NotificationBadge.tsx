'use client'

interface NotificationBadgeProps {
  count: number
  className?: string
}

export default function NotificationBadge({
  count,
  className = '',
}: NotificationBadgeProps) {
  if (count === 0) return null

  const displayCount = count > 99 ? '99+' : count

  return (
    <div
      className={`
        absolute -top-1 -right-1 
        min-w-[20px] h-5 
        flex items-center justify-center 
        bg-red-500 text-white 
        text-xs font-semibold 
        rounded-full px-1.5
        ${className}
      `}
    >
      {displayCount}
    </div>
  )
}
