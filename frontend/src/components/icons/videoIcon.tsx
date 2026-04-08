interface VideoIconProps {
  className?: string
  width?: number | string
  height?: number | string
  color?: string
}

export default function VideoIcon({
  className = '',
  width = 24,
  height = 24,
  color = 'currentColor',
}: VideoIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      stroke={color}
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={width}
      height={height}
      viewBox="0 0 64 64"
    >
      <rect x="8" y="8" width="48" height="48" rx="5" ry="5" fill="none" />

      {/* Botão de Play em tamanho médio (triângulo) */}
      <polygon points="25,22 25,42 42,32" fill={color} stroke="none" />
    </svg>
  )
}
