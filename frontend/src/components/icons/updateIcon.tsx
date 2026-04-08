interface UpdateIconProps {
  className?: string
  width?: number | string
  height?: number | string
  color?: string
}

export default function UpdateIcon({
  className = '',
  width = 24,
  height = 24,
  color = 'currentColor',
}: UpdateIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={width}
      height={height}
      viewBox="0 0 27.971 27.971"
      fill={color}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M23.92,14.746l-4.05-4.051h2.374l-0.068-0.177c-1.407-3.561-4.882-6.088-8.95-6.088c-5.312,0-9.62,4.307-9.62,9.616 c0,5.316,4.308,9.623,9.62,9.623c3.907,0,7.271-2.128,8.775-5.479l3.854,0.039c-0.013,0.03-3.032,8.918-12.693,8.918 C5.893,27.148,0,21.254,0,13.987C0,6.715,5.893,0.824,13.161,0.824c6.08,0,11.195,4.116,12.709,9.715l0.032,0.156h2.069 L23.92,14.746z" />
    </svg>
  )
}
