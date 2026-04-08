'use client'

import { useClickOutside } from '@/src/hooks/useClickOutside'
import { MAX_INVESTMENT_INPUT } from '@/src/utils/investmentFormatters'
import { useRouter } from 'next/navigation'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import TargetIcon from '../../icons/targetIcon'
import { InvestmentDropdownPanel, InvestmentSection } from './InvestmentSection'
import { SegmentDropdownPanel, SegmentSection } from './SegmentSection'

export interface HeroSearchFilters {
  minInvestment: number
  maxInvestment: number
  segment: string
}

const HeroSearch = () => {
  const router = useRouter()
  const [focusedSection, setFocusedSection] = useState<
    'investment' | 'segment' | null
  >(null)
  const [minInvestmentValue, setMinInvestmentValue] = useState(0)
  const [maxInvestmentValue, setMaxInvestmentValue] = useState(0)
  const [hasSelectedInvestment, setHasSelectedInvestment] = useState(false)
  const [selectedSegment, setSelectedSegment] = useState('')
  const [showSegmentDropdown, setShowSegmentDropdown] = useState(false)
  const [showInvestmentDropdown, setShowInvestmentDropdown] = useState(false)
  const [hoverSearch, setHoverSearch] = useState(false)

  // Panel position/size derived from the active section ref
  const [panelStyle, setPanelStyle] = useState<{
    left: number
    width: number
  } | null>(null)

  const investmentRef = useRef<HTMLDivElement>(null)
  const segmentRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Measure the active section and animate the panel to it
  useLayoutEffect(() => {
    const activeRef =
      focusedSection === 'investment'
        ? investmentRef
        : focusedSection === 'segment'
          ? segmentRef
          : null

    if (!activeRef?.current || !searchRef.current) {
      setPanelStyle(null)
      return
    }

    const sectionRect = activeRef.current.getBoundingClientRect()
    const containerRect = searchRef.current.getBoundingClientRect()

    setPanelStyle({
      left: sectionRect.left - containerRect.left,
      width: sectionRect.width,
    })
  }, [focusedSection])

  const handleClickOutside = useCallback(() => {
    setShowSegmentDropdown(false)
    setShowInvestmentDropdown(false)
    setFocusedSection(null)
  }, [])

  const refsForClickOutside = [investmentRef, segmentRef, dropdownRef]
  useClickOutside(refsForClickOutside, handleClickOutside)

  const handleSearch = useCallback(() => {
    const effectiveMinInvestment =
      minInvestmentValue > 0 ? minInvestmentValue : 0
    const effectiveMaxInvestment =
      maxInvestmentValue > 0 ? maxInvestmentValue : MAX_INVESTMENT_INPUT

    const safeMinInvestment = Math.min(
      effectiveMinInvestment,
      effectiveMaxInvestment,
    )

    const params = new URLSearchParams()
    if (safeMinInvestment > 0) {
      params.set('minInvestment', String(safeMinInvestment))
    }
    if (effectiveMaxInvestment < MAX_INVESTMENT_INPUT) {
      params.set('maxInvestment', String(effectiveMaxInvestment))
    }
    if (selectedSegment) {
      params.set('segment', selectedSegment)
    }
    params.set('scrollToRanking', '1')

    const query = params.toString()
    router.push(`/ranking?${query}`)
  }, [minInvestmentValue, maxInvestmentValue, selectedSegment, router])

  const handleSegmentSelect = useCallback((segment: string) => {
    setSelectedSegment(segment)
    setShowSegmentDropdown(false)
    setFocusedSection(null)
  }, [])

  const isOpen = showInvestmentDropdown || showSegmentDropdown

  // Mount the dropdown at its hidden state first, then flip visible on the
  // next animation frame so the browser has a painted "from" state to
  // transition from — this is the only reliable way to animate conditionally
  // rendered elements in React without CSS @keyframes.
  const [dropdownVisible, setDropdownVisible] = useState(false)
  useEffect(() => {
    if (!isOpen || !panelStyle) {
      setDropdownVisible(false)
      return
    }
    const id = requestAnimationFrame(() => setDropdownVisible(true))
    return () => cancelAnimationFrame(id)
  }, [isOpen, panelStyle])

  return (
    <section
      id="hero-search"
      className="bg-[#E8583B] relative overflow-visible min-h-[300px] md:min-h-[42vh] lg:min-h-[50vh] flex flex-col justify-center"
    >
      {/* Decorative side backgrounds — md+ only (mobile: solid orange only, white title) */}
      <div
        className="hidden md:block pointer-events-none absolute inset-0 z-0 bg-no-repeat"
        style={{
          backgroundImage:
            "url('/assets/LeftQuizSearchBG.png'), url('/assets/RightQuizSearchBG.png')",
          backgroundPosition: 'left bottom, right bottom',
          backgroundSize: 'auto 100%, auto 100%',
        }}
        aria-hidden
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <header className="flex items-center justify-center gap-3 sm:gap-6 mb-4 sm:mb-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 md:hidden bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <TargetIcon
              className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10"
              color="hsl(240 24% 12%)"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-white">
            Qual franquia combina com você?
          </h1>
        </header>

        <div className="max-w-5xl mx-auto relative z-10">
          {/* Search bar */}
          <div
            ref={searchRef}
            onMouseEnter={() => setHoverSearch(true)}
            onMouseLeave={() => setHoverSearch(false)}
            className={`relative rounded-2xl md:rounded-full shadow-2xl transition-all duration-400 ${focusedSection ? 'bg-gray-200 shadow-glow' : 'bg-white'}`}
          >
            {/* Sliding active-section pill */}
            <div
              className={`absolute z-0 rounded-full bg-white shadow-md transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none hidden md:block ${
                focusedSection === 'investment'
                  ? 'inset-y-0 left-0 right-[calc(50%+3px)]'
                  : focusedSection === 'segment'
                    ? 'inset-y-0 left-[calc(50%+3px)] right-0'
                    : 'inset-y-0 left-0 right-0 opacity-0'
              }`}
              aria-hidden
            />

            <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-center">
              <div ref={investmentRef} className="flex-1 min-w-0">
                <InvestmentSection
                  onToggle={() => {
                    setShowSegmentDropdown(false)
                    setShowInvestmentDropdown((prev) => !prev)
                  }}
                  onFocus={() => setFocusedSection('investment')}
                  min={minInvestmentValue}
                  max={maxInvestmentValue}
                  isFocused={focusedSection === 'investment'}
                  isDimmed={focusedSection === 'segment'}
                  hasSelectedInvestment={hasSelectedInvestment}
                />
              </div>

              <div
                className={`hidden md:block h-10 w-px bg-gray-300 transition-opacity duration-300 ${
                  hoverSearch || focusedSection ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <div className="block md:hidden mx-4 h-px bg-gray-100" />

              <div ref={segmentRef} className="flex-1 min-w-0">
                <SegmentSection
                  open={showSegmentDropdown}
                  onToggle={() => {
                    setShowInvestmentDropdown(false)
                    setShowSegmentDropdown((prev) => !prev)
                  }}
                  onFocus={() => setFocusedSection('segment')}
                  selectedSegment={selectedSegment}
                  onSearch={handleSearch}
                  isFocused={focusedSection === 'segment'}
                  isDimmed={focusedSection === 'investment'}
                />
              </div>
            </div>
          </div>

          {/* ── Unified sliding dropdown panel ── */}
          {isOpen && panelStyle && (
            <div
              ref={dropdownRef}
              className="absolute mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 z-[9999] overflow-hidden"
              style={{
                top: '100%',
                left: panelStyle.left,
                width: panelStyle.width,
                transformOrigin: 'top center',
                opacity: dropdownVisible ? 1 : 0,
                transform: dropdownVisible
                  ? 'scale(1) translateY(0px)'
                  : 'scale(0.92) translateY(-8px)',
                transition:
                  'opacity 600ms cubic-bezier(0.16, 1, 0.3, 1), transform 600ms cubic-bezier(0.16, 1, 0.3, 1), left 700ms cubic-bezier(0.16, 1, 0.3, 1), width 700ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* Investment content */}
              <div
                className="transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                  position: showInvestmentDropdown ? 'relative' : 'absolute',
                  inset: showInvestmentDropdown ? undefined : '0',
                  opacity: showInvestmentDropdown ? 1 : 0,
                  transform: showInvestmentDropdown
                    ? 'translateX(0)'
                    : 'translateX(-24px)',
                  pointerEvents: showInvestmentDropdown ? 'auto' : 'none',
                }}
              >
                <InvestmentDropdownPanel
                  min={minInvestmentValue}
                  max={maxInvestmentValue}
                  onMinChange={(v) => {
                    setHasSelectedInvestment(v > 0 || maxInvestmentValue > 0)
                    setMinInvestmentValue(v)
                    if (v > maxInvestmentValue) setMaxInvestmentValue(v)
                  }}
                  onMaxChange={(v) => {
                    setHasSelectedInvestment(minInvestmentValue > 0 || v > 0)
                    setMaxInvestmentValue(v)
                    if (v < minInvestmentValue) setMinInvestmentValue(v)
                  }}
                  onFocus={() => setFocusedSection('investment')}
                />
              </div>

              {/* Segment content */}
              <div
                className="transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                  position: showSegmentDropdown ? 'relative' : 'absolute',
                  inset: showSegmentDropdown ? undefined : '0',
                  opacity: showSegmentDropdown ? 1 : 0,
                  transform: showSegmentDropdown
                    ? 'translateX(0)'
                    : 'translateX(24px)',
                  pointerEvents: showSegmentDropdown ? 'auto' : 'none',
                }}
              >
                <SegmentDropdownPanel onSegmentSelect={handleSegmentSelect} />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default HeroSearch
