'use client'

import {
  countDigits,
  formatInvestmentNoDecimals,
  formatInvestmentWithDecimals,
  INVESTMENT_STEP,
  MAX_INVESTMENT_INPUT,
  MIN_INVESTMENT_RANGE,
  parseInvestmentFromInput,
  positionAfterNDigits,
} from '@/src/utils/investmentFormatters'
import { useEffect, useRef, useState } from 'react'
import { InvestmentRangeSlider } from './InvestmentRangeSlider'

const INPUT_LABEL_STYLE = { letterSpacing: '-1.5px' as const }

export interface InvestmentSectionProps {
  onToggle: () => void
  onFocus: () => void
  min: number
  max: number
  isFocused: boolean
  isDimmed?: boolean
  hasSelectedInvestment?: boolean
}

export function InvestmentSection({
  onToggle,
  onFocus,
  min,
  max,
  isFocused,
  isDimmed = false,
  hasSelectedInvestment = false,
}: InvestmentSectionProps) {
  const triggerDisplay = `R$ ${formatInvestmentWithDecimals(min)} - R$ ${formatInvestmentWithDecimals(max)}`
  const triggerCta = 'Qual faixa de investimento você deseja?'

  return (
    <div
      className={`flex-1 relative transition-all duration-400 rounded-full ${
        isFocused ? 'duration-500' : ''
      }`}
    >
      <div
        className={`px-4 md:px-8 py-3 md:py-2 cursor-pointer rounded-2xl md:rounded-full transition-colors duration-200 ${
          isDimmed ? 'hover:bg-gray-300' : ''
        }`}
        onClick={() => {
          onToggle()
          onFocus()
        }}
      >
        <label
          className="block text-base md:text-xl font-normal text-gray-900"
          style={INPUT_LABEL_STYLE}
        >
          Faixa de Investimento?
        </label>
        <input
          type="text"
          placeholder={triggerCta}
          value={hasSelectedInvestment ? triggerDisplay : ''}
          readOnly
          className="w-full text-base md:text-xl font-normal text-gray-600 placeholder:text-[#C9C9C9] bg-transparent outline-none cursor-pointer"
          style={INPUT_LABEL_STYLE}
        />
      </div>
    </div>
  )
}

// ─── Dropdown panel content (rendered by HeroSearch in the unified panel) ───

export interface InvestmentDropdownPanelProps {
  min: number
  max: number
  onMinChange: (value: number) => void
  onMaxChange: (value: number) => void
  onFocus: () => void
}

export function InvestmentDropdownPanel({
  min,
  max,
  onMinChange,
  onMaxChange,
  onFocus,
}: InvestmentDropdownPanelProps) {
  const [tab, setTab] = useState<'bar' | 'inputs'>('inputs')
  const [minInputString, setMinInputString] = useState(() =>
    formatInvestmentNoDecimals(min),
  )
  const [maxInputString, setMaxInputString] = useState(() =>
    formatInvestmentNoDecimals(max),
  )
  const minInputRef = useRef<HTMLInputElement>(null)
  const maxInputRef = useRef<HTMLInputElement>(null)
  const nextMinCaretRef = useRef<number | null>(null)
  const nextMaxCaretRef = useRef<number | null>(null)
  const lastTabRef = useRef(tab)

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const selectionStart = e.target.selectionStart ?? value.length
    const digitsBeforeCaret = countDigits(value.substring(0, selectionStart))
    const parsed = parseInvestmentFromInput(value)
    onMinChange(parsed)
    if (parsed > max) onMaxChange(parsed)
    const formatted = formatInvestmentNoDecimals(parsed)
    nextMinCaretRef.current = positionAfterNDigits(formatted, digitsBeforeCaret)
    setMinInputString(formatted)
  }

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const selectionStart = e.target.selectionStart ?? value.length
    const digitsBeforeCaret = countDigits(value.substring(0, selectionStart))
    const parsed = parseInvestmentFromInput(value)
    onMaxChange(parsed)
    if (parsed < min) onMinChange(parsed)
    const formatted = formatInvestmentNoDecimals(parsed)
    nextMaxCaretRef.current = positionAfterNDigits(formatted, digitsBeforeCaret)
    setMaxInputString(formatted)
  }

  const handleMinInputBlur = () =>
    setMinInputString(formatInvestmentNoDecimals(min))
  const handleMaxInputBlur = () =>
    setMaxInputString(formatInvestmentNoDecimals(max))

  useEffect(() => {
    if (nextMinCaretRef.current !== null && minInputRef.current) {
      const pos = nextMinCaretRef.current
      nextMinCaretRef.current = null
      requestAnimationFrame(() =>
        minInputRef.current!.setSelectionRange(pos, pos),
      )
    }
  }, [minInputString])

  useEffect(() => {
    if (nextMaxCaretRef.current !== null && maxInputRef.current) {
      const pos = nextMaxCaretRef.current
      nextMaxCaretRef.current = null
      requestAnimationFrame(() =>
        maxInputRef.current!.setSelectionRange(pos, pos),
      )
    }
  }, [maxInputString])

  useEffect(() => {
    if (lastTabRef.current !== tab) {
      setMinInputString(formatInvestmentNoDecimals(min))
      setMaxInputString(formatInvestmentNoDecimals(max))
    }
    lastTabRef.current = tab
  }, [min, max, tab])

  return (
    <div>
      <div className="relative flex max-w-[60vw] md:max-w-[20vw] mx-auto gap-2 p-2 bg-gray-100 rounded-full m-4">
        <div
          className="absolute top-2 bottom-2 rounded-full bg-white shadow-md transition-[left] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] w-[calc(50%-4px)] z-0"
          // Align within the container padding when the pill moves right.
          style={{ left: tab === 'inputs' ? 8 : 'calc(50% - 4px)' }}
          aria-hidden
        />
        <button
          type="button"
          onClick={() => setTab('inputs')}
          className="relative z-10 flex-1 rounded-full px-6 py-2 text-sm font-medium transition-colors duration-300 cursor-pointer text-gray-600 hover:text-gray-900 data-[active]:text-gray-900"
          data-active={tab === 'inputs' || undefined}
        >
          Manual
        </button>
        <button
          type="button"
          onClick={() => setTab('bar')}
          className="relative z-10 flex-1 rounded-full px-6 py-2 text-sm font-medium transition-colors duration-300 cursor-pointer text-gray-600 hover:text-gray-900 data-[active]:text-gray-900"
          data-active={tab === 'bar' || undefined}
        >
          Faixa
        </button>
      </div>
      <div className="px-6 py-4 overflow-hidden">
        {tab === 'bar' ? (
          <div key="bar" className="animate-fade-in">
            <InvestmentRangeSlider
              min={min}
              max={max}
              onMinChange={(v) => {
                onMinChange(v)
                if (v > max) onMaxChange(v)
              }}
              onMaxChange={(v) => {
                onMaxChange(v)
                if (v < min) onMinChange(v)
              }}
              minBound={MIN_INVESTMENT_RANGE}
              maxBound={MAX_INVESTMENT_INPUT}
              step={INVESTMENT_STEP}
            />
          </div>
        ) : (
          <div
            key="inputs"
            className="animate-fade-in flex items-baseline gap-4"
          >
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Investimento Mínimo
              </label>
              <input
                ref={minInputRef}
                type="text"
                placeholder="0"
                value={minInputString}
                onChange={handleMinInputChange}
                onBlur={handleMinInputBlur}
                onFocus={() => {
                  onFocus()
                  if (!minInputString) {
                    setMinInputString(formatInvestmentNoDecimals(min))
                  }
                }}
                className="w-full px-4 py-2 text-lg font-normal text-gray-900 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-primary focus:bg-white transition-colors"
                style={INPUT_LABEL_STYLE}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Investimento Máximo
              </label>
              <input
                ref={maxInputRef}
                type="text"
                placeholder="0"
                value={maxInputString}
                onChange={handleMaxInputChange}
                onBlur={handleMaxInputBlur}
                onFocus={() => {
                  onFocus()
                  if (!maxInputString) {
                    setMaxInputString(formatInvestmentNoDecimals(max))
                  }
                }}
                className="w-full px-4 py-2 text-lg font-normal text-gray-900 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-primary focus:bg-white transition-colors"
                style={INPUT_LABEL_STYLE}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
