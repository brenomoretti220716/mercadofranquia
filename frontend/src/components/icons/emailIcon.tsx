interface MailIconProps {
  className?: string
  width?: number | string
  height?: number | string
  color?: string
}

export default function MailIcon({
  className = '',
  width = 24,
  height = 24,
  color = 'currentColor',
}: MailIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 32 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill={color}
    >
      <path d="M30,20 C30,20.203 29.961,20.395 29.905,20.578 L21,11 L30,4 L30,20 L30,20 Z M3.556,21.946 L12.58,12.33 L16,14.915 L19.272,12.314 L28.444,21.946 C28.301,21.979 3.699,21.979 3.556,21.946 L3.556,21.946 Z M2,20 L2,4 L11,11 L2.095,20.578 C2.039,20.395 2,20.203 2,20 L2,20 Z M29,2 L16,12 L3,2 L29,2 L29,2 Z M28,0 L4,0 C1.791,0 0,1.791 0,4 L0,20 C0,22.209 1.791,24 4,24 L28,24 C30.209,24 32,22.209 32,20 L32,4 C32,1.791 30.209,0 28,0 L28,0 Z" />
    </svg>
  )
}
