import { normalizeQuarter } from '@/src/components/mercado/abfChartFilters'

/** Re-export for callers that should not import chart filters directly. */
export { normalizeQuarter as normalizeAbfQuarter }

const QUARTER_LAST_MONTH_DAY: Record<
  string,
  readonly [monthIndex: number, day: number]
> = {
  Q1: [2, 31],
  Q2: [5, 30],
  Q3: [8, 30],
  Q4: [11, 31],
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/**
 * Last calendar day of the ABF quarter in the local timezone (end of that civil day).
 */
export function getAbfQuarterLastDay(
  year: number,
  quarter: string,
): Date | null {
  const q = normalizeQuarter(quarter)
  const md = QUARTER_LAST_MONTH_DAY[q]
  if (!md) return null
  const [monthIndex, day] = md
  return new Date(year, monthIndex, day)
}

/**
 * True when the referenced year/quarter is not yet over on the calendar (local date):
 * includes the current quarter until its last day, and any future quarter.
 * Invalid quarter string → false.
 *
 * To show notice only for strictly future quarters, compare against quarter start instead.
 */
export function isAbfYearQuarterForecast(
  year: number,
  quarter: string,
  now: Date = new Date(),
): boolean {
  const end = getAbfQuarterLastDay(year, quarter)
  if (!end) return false
  return startOfLocalDay(now) <= startOfLocalDay(end)
}
