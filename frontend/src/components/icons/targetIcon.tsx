interface IconProps {
  className?: string
  width?: number | string
  height?: number | string
  color?: string
}

export default function TargetIcon({
  className = '',
  width = 24,
  height = 24,
  color = 'currentColor',
}: IconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}
