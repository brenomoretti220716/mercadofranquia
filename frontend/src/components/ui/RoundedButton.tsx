import Link from 'next/link'
import { useState } from 'react'

type RoundedButtonProps = {
  text: string
  textColor?: string
  hoverTextColor?: string
  hoverColor?: string
  color?: string
  borderColor?: string
  hoverBorderColor?: string
  borderWidth?: string
  className?: string
  onClick?: () => void
  href?: string
  target?: string
  disabled?: boolean
  bottomBorder?: boolean
  bottomBorderColor?: string
  hoverBottomBorderColor?: string
  noRounded?: boolean
  loading?: boolean
  loadingText?: string
  type?: 'button' | 'submit' | 'reset'
}

export default function RoundedButton({
  text,
  textColor,
  hoverTextColor,
  color,
  hoverColor,
  borderColor,
  hoverBorderColor,
  borderWidth,
  bottomBorder,
  bottomBorderColor,
  hoverBottomBorderColor,
  noRounded,
  className,
  onClick,
  href,
  target,
  disabled = false,
  loading = false,
  loadingText,
  type = 'submit',
}: RoundedButtonProps) {
  const [isHovering, setIsHovering] = useState(false)

  const setBgColor = isHovering && !disabled ? hoverColor || color : color

  const setText =
    isHovering && !disabled ? hoverTextColor || 'white' : textColor || 'black'

  const setBorder =
    isHovering && !disabled ? hoverBorderColor || borderColor : borderColor

  const setBottomBorder =
    isHovering && !disabled
      ? hoverBottomBorderColor || bottomBorderColor
      : bottomBorderColor

  const buttonStyles = {
    color: setText,
    backgroundColor: setBgColor,
    ...(setBorder && { border: `${borderWidth || '1px'} solid ${setBorder}` }),
    ...(bottomBorder && {
      borderBottom: `${borderWidth || '1px'} solid ${setBottomBorder}`,
    }),
  }

  const buttonClasses = `text-center px-3 py-2 md:px-4 md:py-3 text-sm md:text-base font-medium w-auto transition-all duration-200 
  ${noRounded ? 'rounded-none' : 'rounded-full'} 
  ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} 
  ${isHovering && !disabled ? 'hover:text-white' : 'text-black'} ${className || ''}`

  const finalText = loading ? loadingText || text : text
  const buttonContent = (
    <>
      {loading && (
        <span className="inline-block mr-2 align-middle">
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
        </span>
      )}
      {finalText}
    </>
  )

  if (href) {
    return (
      <Link href={href} target={target}>
        <div
          onMouseEnter={() => !disabled && setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className={buttonClasses}
          style={buttonStyles}
          onClick={disabled || loading ? undefined : onClick}
        >
          {buttonContent}
        </div>
      </Link>
    )
  }

  return (
    <button
      type={type}
      onMouseEnter={() => !disabled && setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={buttonClasses}
      style={buttonStyles}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
    >
      {buttonContent}
    </button>
  )
}
