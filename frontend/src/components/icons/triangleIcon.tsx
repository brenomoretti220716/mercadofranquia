interface TriangleIconProps {
  className?: string
  width?: number | string
  height?: number | string
  color?: string
  upsideDown?: boolean
}

export default function TriangleIcon({
  className = '',
  width = 16,
  height = 16,
  color = 'currentColor',
  upsideDown = false,
}: TriangleIconProps) {
  const rotation = upsideDown ? 'rotate-180' : ''

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${rotation}`}
      fill={color}
    >
      <path d="M12 4L3 20h18L12 4z" />
    </svg>
  )
}
