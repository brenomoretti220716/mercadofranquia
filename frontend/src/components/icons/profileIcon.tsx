interface ProfileIconProps {
  className?: string
  width?: number | string
  height?: number | string
  color?: string
}

export default function ProfileIcon({
  className = '',
  width = 24,
  height = 24,
  color = 'currentColor',
}: ProfileIconProps) {
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
      <circle cx="12" cy="7" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  )
}
