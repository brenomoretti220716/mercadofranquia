'use client'

import { useEffect, useRef, useState } from 'react'

interface MarqueeProps {
  children: React.ReactNode
  className?: string
  forceAnimation?: boolean
}

/**
 * Marquee component that scrolls text when content overflows the container.
 * Animates on all screen sizes whenever the content is wider than its wrapper.
 */
export default function Marquee({
  children,
  className = '',
  forceAnimation = false,
}: MarqueeProps) {
  const marqueeRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [shouldAnimate, setShouldAnimate] = useState(false)

  useEffect(() => {
    const updateShouldAnimate = () => {
      const wrapper = wrapperRef.current
      const content = marqueeRef.current
      if (!wrapper || !content) return

      const firstSpan = content.querySelector('span:first-child')
      if (!firstSpan) return

      const singleWidth = firstSpan.scrollWidth
      const containerWidth = wrapper.clientWidth

      setShouldAnimate(forceAnimation || singleWidth > containerWidth + 1)
    }

    updateShouldAnimate()
    window.addEventListener('resize', updateShouldAnimate)
    return () => window.removeEventListener('resize', updateShouldAnimate)
  }, [children, forceAnimation])

  useEffect(() => {
    if (!shouldAnimate || !marqueeRef.current) {
      if (marqueeRef.current) {
        marqueeRef.current.style.transform = 'translateX(0px)'
      }
      return
    }

    let animationId: number
    let position = 0
    const speed = 0.3

    const animate = () => {
      const element = marqueeRef.current
      if (!element) return

      const width = element.scrollWidth / 2

      position += speed

      if (position >= width) {
        position = 0
      }

      element.style.transform = `translateX(-${position}px)`
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [shouldAnimate])

  return (
    <div
      ref={wrapperRef}
      className={`relative overflow-hidden ${className}`}
      style={
        shouldAnimate
          ? {
              WebkitMaskImage:
                'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
              maskImage:
                'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
            }
          : undefined
      }
    >
      <div
        ref={marqueeRef}
        className="inline-flex whitespace-nowrap"
        style={{ willChange: shouldAnimate ? 'transform' : 'auto' }}
      >
        <span className={shouldAnimate ? 'pr-8' : ''}>{children}</span>
        {shouldAnimate && <span className="pr-8">{children}</span>}
      </div>
    </div>
  )
}
