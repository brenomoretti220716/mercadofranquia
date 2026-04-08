interface EmojiIconProps {
  className?: string
  width?: number | string
  height?: number | string
  color?: string
}

export default function EmojiIcon({
  className = '',
  width = 24,
  height = 24,
  color = 'currentColor',
}: EmojiIconProps) {
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
      {/* Círculo do rosto */}
      <circle cx="12" cy="12" r="10" />

      {/* Olhos */}
      <circle cx="9" cy="9" r="1" fill={color} />
      <circle cx="15" cy="9" r="1" fill={color} />

      {/* Sorriso */}
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    </svg>
  )
}
