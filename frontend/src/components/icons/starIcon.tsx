interface StarIconProps {
  className?: string
  width?: number | string
  height?: number | string
  color?: string
  filled?: boolean
}

export default function StarIcon({
  className = '',
  width = 24,
  height = 24,
  color = 'currentColor',
  filled = false,
}: StarIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} cursor-pointer`}
      fill={filled ? color : 'none'}
      width={width}
      height={height}
      viewBox="0 0 24 24"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  )
}
