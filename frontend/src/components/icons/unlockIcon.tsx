interface UnlockIconProps {
  className?: string
  width?: number | string
  height?: number | string
  color?: string
}

export default function UnlockIcon({
  className = '',
  width = 24,
  height = 24,
  color = 'currentColor',
}: UnlockIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      stroke={color}
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={width}
      height={height}
      viewBox="0 0 64 64"
    >
      <rect x="18" y="31" width="30" height="21" rx="2" ry="2" />
      <path d="M23 31V22C23 17.038 27.037 13 32 13C36.963 13 41 17.038 41 22V25" />
    </svg>
  )
}
