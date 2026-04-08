interface IconProps {
  className?: string
  width?: number | string
  height?: number | string
  color?: string
}

export default function ScissorsIcon({
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
      <circle cx="6" cy="6" r="3" />
      <path d="M8.12 8.12 12 12" />
      <circle cx="6" cy="18" r="3" />
      <path d="M14.8 14.8 20 20" />
      <path d="M14.8 9.2 20 4" />
      <path d="m8.12 15.88 4.38-4.38" />
    </svg>
  )
}
