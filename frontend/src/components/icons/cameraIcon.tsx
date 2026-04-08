interface CameraIconProps {
  className?: string
  width?: number | string
  height?: number | string
  color?: string
}

export default function CameraIcon({
  className = '',
  width = 24,
  height = 24,
  color = 'currentColor',
}: CameraIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Rectangle with larger gap where the line passes through */}
      <path d="M3 3 L21 3 L21 15 L15 15" />
      <path d="M9 15 L3 15 L3 3" />

      {/* Download arrow starting from center of rectangle */}
      <line x1="12" y1="9" x2="12" y2="22" />
      <polyline points="8,18 12,22 16,18" />
    </svg>
  )
}
