interface FranchiseIconProps {
  className?: string
  width?: number | string
  height?: number | string
  color?: string
}

export default function FranchiseIcon({
  className = '',
  width = 24,
  height = 24,
  color = 'currentColor',
}: FranchiseIconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke={color}
      width={width}
      height={height}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Building outline */}
      <rect x="4" y="6" width="16" height="16" strokeWidth="1.5" fill="none" />

      {/* Windows - left column (more centered) */}
      <rect x="8" y="8" width="2" height="2" strokeWidth="1" fill={color} />
      <rect x="8" y="12" width="2" height="2" strokeWidth="1" fill={color} />
      <rect x="8" y="16" width="2" height="2" strokeWidth="1" fill={color} />

      {/* Windows - right column (more centered) */}
      <rect x="14" y="8" width="2" height="2" strokeWidth="1" fill={color} />
      <rect x="14" y="12" width="2" height="2" strokeWidth="1" fill={color} />
      <rect x="14" y="16" width="2" height="2" strokeWidth="1" fill={color} />

      {/* Door - smaller and with more spacing from windows */}
      <rect x="11" y="19" width="2" height="3" strokeWidth="1.5" fill={color} />

      {/* Ground line - wider */}
      <line
        x1="2"
        y1="22"
        x2="22"
        y2="22"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
