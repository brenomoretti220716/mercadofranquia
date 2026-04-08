import { useEffect, useRef, useState } from 'react'

interface UseCountUpOptions {
  duration?: number // Animation duration in milliseconds
  decimals?: number // Number of decimal places for float values
}

export function useCountUp(
  end: number | null,
  options: UseCountUpOptions = {},
): number {
  const { duration = 2000, decimals = 0 } = options
  const [count, setCount] = useState(0)
  const animationFrameRef = useRef<number | null>(null)
  const endRef = useRef(end)

  useEffect(() => {
    // Update ref when end changes
    endRef.current = end

    if (end === null || end === undefined) {
      setCount(0)
      return
    }

    // Reset count to 0 when end value changes
    setCount(0)

    // Cancel any existing animation
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    let startTime: number | null = null
    const startValue = 0

    const animate = (currentTime: number) => {
      if (startTime === null) {
        startTime = currentTime
      }

      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)

      // Use ref to get latest end value
      const targetEnd = endRef.current ?? 0
      const currentCount = startValue + (targetEnd - startValue) * easeOutQuart

      if (decimals > 0) {
        setCount(Number(currentCount.toFixed(decimals)))
      } else {
        setCount(Math.floor(currentCount))
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        // Ensure we end exactly at the target value
        if (decimals > 0) {
          setCount(Number(targetEnd.toFixed(decimals)))
        } else {
          setCount(Math.floor(targetEnd))
        }
        animationFrameRef.current = null
      }
    }

    // Small delay to ensure state is reset before starting animation
    const timeoutId = setTimeout(() => {
      animationFrameRef.current = requestAnimationFrame(animate)
    }, 10)

    return () => {
      clearTimeout(timeoutId)
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [end, duration, decimals])

  return count
}
