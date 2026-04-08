interface CheckCircleIconProps {
  className?: string
  width?: number | string
  height?: number | string
  color?: string
}

export default function CheckCircleIcon({
  className = '',
  width = 24,
  height = 24,
  color = 'currentColor',
}: CheckCircleIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}
