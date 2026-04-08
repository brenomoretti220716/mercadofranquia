interface FilterIconProps {
  className?: string
  width?: number | string
  height?: number | string
  color?: string
}

export default function FilterIcon({
  className = '',
  width = 24,
  height = 24,
  color = 'currentColor',
}: FilterIconProps) {
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
      {/* Filter funnel shape */}
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}
