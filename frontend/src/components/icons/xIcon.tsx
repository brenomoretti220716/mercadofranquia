interface XIconProps {
  className?: string
  width?: number | string
  height?: number | string
  color?: string
}

export default function XIcon({
  className = '',
  width = 24,
  height = 24,
  color = 'currentColor',
}: XIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
    >
      <path
        d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932L18.901 1.153ZM17.61 20.644h2.039L6.486 3.24H4.298L17.61 20.644Z"
        fill={color}
      />
    </svg>
  )
}
