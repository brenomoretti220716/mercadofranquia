interface ReturnIconProps {
  className?: string
  width?: number | string
  height?: number | string
  color?: string
}

export default function ReturnIcon({
  className = '',
  width = 24,
  height = 24,
  color = 'currentColor',
}: ReturnIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`${className}`}
      fill="none"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 3v8a4 4 0 0 0 4 4h8" />
      <path d="m16 12 3 3-3 3" />
    </svg>
  )
}
