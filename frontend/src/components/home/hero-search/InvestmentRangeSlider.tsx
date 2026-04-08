'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface InvestmentRangeSliderProps {
  min: number
  max: number
  onMinChange: (value: number) => void
  onMaxChange: (value: number) => void
  minBound: number
  maxBound: number
  step: number
}

const CONTAINER_PX = 32

function snapToStep(
  value: number,
  step: number,
  minBound: number,
  maxBound: number,
): number {
  const snapped = Math.round(value / step) * step
  return Math.max(minBound, Math.min(maxBound, snapped))
}

export function InvestmentRangeSlider({
  min,
  max,
  onMinChange,
  onMaxChange,
  minBound,
  maxBound,
  step,
}: InvestmentRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null)
  // Local display values: update immediately on drag so bar and thumbs stay in sync (no parent round-trip delay)
  const [displayMin, setDisplayMin] = useState(min)
  const [displayMax, setDisplayMax] = useState(max)

  // Sync from props when not dragging (e.g. user switched tab or changed inputs)
  useEffect(() => {
    if (activeThumb === null) {
      setDisplayMin(min)
      setDisplayMax(max)
    }
  }, [min, max, activeThumb])

  const valueToPercent = useCallback(
    (value: number) => {
      const range = maxBound - minBound
      if (range === 0) return 0
      return ((value - minBound) / range) * 100
    },
    [minBound, maxBound],
  )

  const getValueFromClientX = useCallback(
    (clientX: number): number => {
      const track = trackRef.current
      if (!track) return minBound
      const rect = track.getBoundingClientRect()
      const innerLeft = rect.left + CONTAINER_PX
      const innerWidth = rect.width - 2 * CONTAINER_PX
      if (innerWidth <= 0) return minBound
      const percent = Math.max(
        0,
        Math.min(1, (clientX - innerLeft) / innerWidth),
      )
      const value = minBound + percent * (maxBound - minBound)
      return snapToStep(value, step, minBound, maxBound)
    },
    [minBound, maxBound, step],
  )

  useEffect(() => {
    if (activeThumb === null) return

    const handlePointerMove = (e: PointerEvent) => {
      const value = getValueFromClientX(e.clientX)
      if (activeThumb === 'min') {
        const clamped = Math.min(value, displayMax)
        setDisplayMin(clamped)
        onMinChange(clamped)
        if (clamped > displayMax) {
          setDisplayMax(clamped)
          onMaxChange(clamped)
        }
      } else {
        const clamped = Math.max(value, displayMin)
        setDisplayMax(clamped)
        onMaxChange(clamped)
        if (clamped < displayMin) {
          setDisplayMin(clamped)
          onMinChange(clamped)
        }
      }
    }

    const handlePointerUp = () => setActiveThumb(null)

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
    document.addEventListener('pointercancel', handlePointerUp)
    return () => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
      document.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [
    activeThumb,
    displayMin,
    displayMax,
    getValueFromClientX,
    onMinChange,
    onMaxChange,
  ])

  const minPercent = valueToPercent(displayMin)
  const maxPercent = valueToPercent(displayMax)

  return (
    <div className="mb-6">
      {/* Glassmorphism container – Airbnb-inspired frosted glass */}
      <div
        ref={trackRef}
        className="relative w-full overflow-visible rounded-[40px] border border-white/30 bg-gradient-to-br"
      >
        {/* Inner groove – recessed channel */}
        <div className="relative h-8 w-full overflow-visible rounded-full bg-gradient-to-b from-black/[0.12] to-black/[0.06] shadow-[inset_0_2px_8px_rgba(0,0,0,0.2),inset_0_-1px_2px_rgba(255,255,255,0.1)]">
          {/* Active segment – gradient fill with glow */}
          <div
            className="absolute h-5 top-1/2 -translate-y-1/2 overflow-visible rounded-full bg-gradient-to-r from-primary via-[#cf4606] to-[#d90b63] 
            shadow-[0_0_20px_rgba(255,56,92,0.5),0_0_40px_rgba(255,56,92,0.2),inset_0_1px_2px_rgba(255,255,255,0.3),inset_0_-1px_1px_rgba(0,0,0,0.2)]"
            style={{
              left: `calc(6px + (100% - 12px) * ${minPercent} / 100)`,
              width: `calc((100% - 12px) * ${maxPercent - minPercent} / 100)`,
            }}
          />
        </div>

        {/* Thumbs – polished knobs with Airbnb-style depth */}
        <div
          role="slider"
          aria-valuemin={minBound}
          aria-valuemax={maxBound}
          aria-valuenow={displayMin}
          tabIndex={0}
          className="absolute top-1/2 z-20 h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-grab overflow-visible rounded-full border-[3px] border-gray-900/80 bg-gradient-to-b from-white to-gray-50 
          shadow-[0_0_0_4px_rgba(255,255,255,0.3),0_4px_12px_rgba(0,0,0,0.15),0_8px_24px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.05)] 
          backdrop-blur-sm transition-[transform,box-shadow] duration-150 hover:scale-105 hover:shadow-[0_0_0_5px_rgba(255,255,255,0.4),0_6px_16px_rgba(0,0,0,0.2),0_12px_32px_rgba(0,0,0,0.15)] 
          active:scale-95 active:cursor-grabbing touch-none"
          style={{
            left: `calc(${CONTAINER_PX}px + (100% - ${2 * CONTAINER_PX}px) * ${minPercent} / 100)`,
          }}
          onPointerDown={(e) => {
            e.preventDefault()
            setActiveThumb('min')
          }}
        />
        <div
          role="slider"
          aria-valuemin={minBound}
          aria-valuemax={maxBound}
          aria-valuenow={displayMax}
          tabIndex={0}
          className="absolute top-1/2 z-20 h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-grab overflow-visible rounded-full border-[3px] border-gray-900/80 bg-gradient-to-b from-white to-gray-50
          shadow-[0_0_0_4px_rgba(255,255,255,0.3),0_4px_12px_rgba(0,0,0,0.15),0_8px_24px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.05)] 
          backdrop-blur-sm transition-[transform,box-shadow] duration-150 hover:scale-105 hover:shadow-[0_0_0_5px_rgba(255,255,255,0.4),0_6px_16px_rgba(0,0,0,0.2),0_12px_32px_rgba(0,0,0,0.15)] 
          active:scale-95 active:cursor-grabbing touch-none"
          style={{
            left: `calc(${CONTAINER_PX}px + (100% - ${2 * CONTAINER_PX}px) * ${maxPercent} / 100)`,
          }}
          onPointerDown={(e) => {
            e.preventDefault()
            setActiveThumb('max')
          }}
        />
      </div>

      {/* Value labels – show current range */}
      <div className="mt-4 flex items-center justify-between px-2">
        <div className="text-sm font-medium text-gray-700">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(displayMin)}
        </div>
        <div className="text-sm font-medium text-gray-700">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(displayMax)}
        </div>
      </div>
    </div>
  )
}
