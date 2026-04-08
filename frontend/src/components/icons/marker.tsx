interface MarkerIconProps {
  className?: string
  width?: number | string
  height?: number | string
  color?: string
}

export default function MarkerIcon({
  className = '',
  width = 24,
  height = 24,
  color = 'currentColor',
}: MarkerIconProps) {
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
      <path d="M12 4l5 3v10l-5-3-5 3V7l5-3z" />
    </svg>
  )
}
