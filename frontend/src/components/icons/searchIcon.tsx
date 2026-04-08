interface SearchIconProps {
  className?: string
  width?: number | string
  height?: number | string
  color?: string
}

export default function SearchIcon({
  className = '',
  width = 24,
  height = 24,
  color = 'currentColor',
}: SearchIconProps) {
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
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}
