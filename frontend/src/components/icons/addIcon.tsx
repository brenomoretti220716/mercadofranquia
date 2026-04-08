interface AddIconProps {
  className?: string
  width?: number | string
  height?: number | string
  color?: string
}

export default function AddIcon({
  className = '',
  width = 24,
  height = 24,
  color = 'currentColor',
}: AddIconProps) {
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
