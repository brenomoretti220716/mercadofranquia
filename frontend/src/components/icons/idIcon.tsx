interface IdIconProps {
  className?: string
  width?: number | string
  height?: number | string
  color?: string
}

export default function IdIcon({
  className = '',
  width = 24,
  height = 24,
  color = 'currentColor',
}: IdIconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke={color}
      width={width}
      height={height}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Badge outline - vertical format (longer) */}
      <rect
        x="3"
        y="3"
        width="18"
        height="20"
        rx="2"
        ry="2"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Hole line inside the card (top part) - smaller */}
      <line
        x1="9"
        y1="6"
        x2="15"
        y2="6"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Person icon inside badge - filled and larger */}
      <g transform="translate(4, 9)">
        {/* Head - filled and larger */}
        <circle
          cx="8"
          cy="3.5"
          r="2.5"
          strokeWidth="1.2"
          fill={color}
          stroke={color}
        />

        {/* Body/shoulders - filled and larger */}
        <path
          d="M2 13c0-2.5 2.5-5 6-5s6 2.5 6 5v3H2v-3z"
          strokeWidth="1.2"
          fill={color}
          stroke={color}
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}
