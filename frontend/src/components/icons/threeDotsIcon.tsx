interface ThreeDotsIconProps {
  className?: string
  width?: number | string
  height?: number | string
  color?: string
}

export default function ThreeDotsIcon({
  className = '',
  width = 24,
  height = 24,
  color = 'currentColor',
}: ThreeDotsIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} cursor-pointer`}
      fill="none"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Three dots in a row (horizontal) */}
      <circle cx="5" cy="12" r="2" fill={color} stroke="none" />
      <circle cx="12" cy="12" r="2" fill={color} stroke="none" />
      <circle cx="19" cy="12" r="2" fill={color} stroke="none" />
    </svg>
  )
}
