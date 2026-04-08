interface ArrowUpIconProps {
  className?: string
  width?: number | string
  height?: number | string
  color?: string
}

export default function ArrowUpIcon({
  className = '',
  width = 24,
  height = 24,
  color = 'currentColor',
}: ArrowUpIconProps) {
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
      <path d="M5 15l7-7 7 7" />
    </svg>
  )
}
