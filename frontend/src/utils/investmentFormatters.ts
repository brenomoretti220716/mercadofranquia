/**
 * Investment range constants and formatting utilities for hero search and sliders.
 */

export const MIN_INVESTMENT_RANGE = 0
export const MAX_INVESTMENT_INPUT = 8_300_000
export const INVESTMENT_STEP = 50_000

/** With decimals – use for hero trigger display (e.g. "R$ 100.000,00") */
export function formatInvestmentWithDecimals(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/** No decimals – use for min/max inputs (thousands separator only) */
export function formatInvestmentNoDecimals(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function parseInvestmentFromInput(
  str: string,
  min = MIN_INVESTMENT_RANGE,
  max = MAX_INVESTMENT_INPUT,
): number {
  const numbers = str.replace(/\D/g, '')
  if (!numbers) return min
  const value = Number(numbers)
  return Math.max(min, Math.min(max, value))
}

export function countDigits(s: string): number {
  return s.replace(/\D/g, '').length
}

/** Position in string after the n-th digit (for caret placement after formatting). */
export function positionAfterNDigits(s: string, n: number): number {
  let count = 0
  for (let i = 0; i < s.length; i++) {
    if (/\d/.test(s[i])) count++
    if (count === n) return i + 1
  }
  return s.length
}
