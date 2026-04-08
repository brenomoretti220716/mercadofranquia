interface RadioButtonProps {
  className?: string
  width?: number | string
  height?: number | string
  color?: string
}

export default function RadioButtonIcon({
  className = '',
  width = 64,
  height = 64,
  color = '#6B7280',
}: RadioButtonProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`${className}`}
      width={width}
      height={height}
      viewBox="0 0 64 64"
    >
      {/* OFF Button (Top) - No background */}
      <rect
        x="8"
        y="4"
        width="48"
        height="24"
        rx="12"
        ry="12"
        fill="none"
        stroke={color}
        strokeWidth="2"
      />

      {/* OFF Button Circle (Left position) */}
      <circle
        cx="20"
        cy="16"
        r="8"
        fill="white"
        stroke={color}
        strokeWidth="2"
      />

      {/* ON Button (Bottom) - With gray background */}
      <rect
        x="8"
        y="36"
        width="48"
        height="24"
        rx="12"
        ry="12"
        fill="#E5E7EB"
        stroke={color}
        strokeWidth="2"
      />

      {/* ON Button Circle (Right position) */}
      <circle
        cx="44"
        cy="48"
        r="8"
        fill="white"
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  )
}
