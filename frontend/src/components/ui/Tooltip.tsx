'use client'

import { useState, useRef, useEffect } from 'react'
import InfoIcon from '../icons/infoIcon'

interface TooltipProps {
  content: string
  iconSize?: number
  iconColor?: string
}

export default function Tooltip({
  content,
  iconSize = 16,
  iconColor = '#F1F1F1',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [isMobile, setIsMobile] = useState(false)
  const iconRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Detect if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Update position when tooltip becomes visible
  useEffect(() => {
    if (isVisible && iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect()

      // Position tooltip upper-right to the icon
      setPosition({
        top: rect.top - 10, // Position above with small gap
        left: rect.right + 8, // Position to the right with gap
      })
    }
  }, [isVisible])

  // Handle click outside to close tooltip on mobile
  useEffect(() => {
    if (!isMobile || !isVisible) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        iconRef.current &&
        tooltipRef.current &&
        !iconRef.current.contains(event.target as Node) &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside as EventListener)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener(
        'touchstart',
        handleClickOutside as EventListener,
      )
    }
  }, [isMobile, isVisible])

  const handleIconInteraction = () => {
    if (isMobile) {
      setIsVisible(!isVisible)
    }
  }

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsVisible(true)
    }
  }

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsVisible(false)
    }
  }

  return (
    <>
      <div
        ref={iconRef}
        className="cursor-help items-center"
        onClick={handleIconInteraction}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <InfoIcon width={iconSize} height={iconSize} color={iconColor} />
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translateY(-100%)', // Move up by its own height
          }}
        >
          <div className="relative">
            <div className="text-left font-medium bg-white text-black text-sm px-4 py-3 rounded-lg rounded-bl-none shadow-lg max-w-xs whitespace-normal transition-all duration-300">
              {content}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
