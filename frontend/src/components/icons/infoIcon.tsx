interface InfoIconProps {
  className?: string
  width?: number | string
  height?: number | string
  color?: string
}

export default function InfoIcon({
  className = '',
  width = 16,
  height = 16,
  color = '#FFFFFF',
}: InfoIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M12 8v0M12 12v5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="8" r="0.5" fill={color} />
    </svg>
  )
}
