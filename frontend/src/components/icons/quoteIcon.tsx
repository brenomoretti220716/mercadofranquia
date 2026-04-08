interface IconProps {
  className?: string
  width?: number | string
  height?: number | string
  color?: string
}

export default function QuoteIcon({
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
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1 0 2.5 1 4.5 2.5 5 1 .333 1.5.5 1.5 1.5s-.5 1-1.5 1.5c-2.5.5-4.5.5-7 .5ZM14 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1 0 2.5 1 4.5 2.5 5 1 .333 1.5.5 1.5 1.5s-.5 1-1.5 1.5c-2.5.5-4.5.5-7 .5Z" />
    </svg>
  )
}
