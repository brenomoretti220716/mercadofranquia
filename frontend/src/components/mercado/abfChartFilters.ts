import type { AbfSegmentEntry } from '@/src/services/abfSegments'

/** Normalize quarter string for comparison (e.g. "q1" → "Q1"). */
export function normalizeQuarter(q: string): string {
  return String(q).trim().toUpperCase()
}

function quarterOrderIndex(q: string): number {
  const n = normalizeQuarter(q)
  const m = /^Q([1-4])$/.exec(n)
  if (m) return Number(m[1])
  return 99
}

export function compareQuarterOrder(a: string, b: string): number {
  return quarterOrderIndex(a) - quarterOrderIndex(b)
}

/** Distinct quarters present for a given year, sorted Q1→Q4. */
export function quartersForYear(
  entries: AbfSegmentEntry[],
  year: number,
): string[] {
  const set = new Set<string>()
  for (const e of entries) {
    if (e.year === year) set.add(normalizeQuarter(e.quarter))
  }
  return Array.from(set).sort(compareQuarterOrder)
}

/** All distinct quarters in the dataset, sorted Q1→Q4. */
export function uniqueQuarters(entries: AbfSegmentEntry[]): string[] {
  const set = new Set<string>()
  for (const e of entries) {
    set.add(normalizeQuarter(e.quarter))
  }
  return Array.from(set).sort(compareQuarterOrder)
}

/** Years that have at least one row for the given quarter, ascending. */
export function yearsForQuarter(
  entries: AbfSegmentEntry[],
  quarter: string,
): number[] {
  const q = normalizeQuarter(quarter)
  const years = new Set<number>()
  for (const e of entries) {
    if (normalizeQuarter(e.quarter) === q) years.add(e.year)
  }
  return Array.from(years).sort((a, b) => a - b)
}

export function uniqueYears(entries: AbfSegmentEntry[]): number[] {
  return Array.from(new Set(entries.map((e) => e.year))).sort((a, b) => a - b)
}

export function filterByQuarter(
  entries: AbfSegmentEntry[],
  quarter: string,
): AbfSegmentEntry[] {
  const q = normalizeQuarter(quarter)
  return entries.filter((e) => normalizeQuarter(e.quarter) === q)
}

export function filterByYearAndQuarter(
  entries: AbfSegmentEntry[],
  year: number,
  quarter: string,
): AbfSegmentEntry[] {
  const q = normalizeQuarter(quarter)
  return entries.filter(
    (e) => e.year === year && normalizeQuarter(e.quarter) === q,
  )
}

/** Last quarter available in the most recent year that has data (fallback Q4). */
export function defaultGlobalQuarter(entries: AbfSegmentEntry[]): string {
  if (!entries.length) return 'Q4'
  const years = uniqueYears(entries)
  const maxYear = years[years.length - 1]
  const qs = quartersForYear(entries, maxYear)
  return qs.length ? qs[qs.length - 1]! : 'Q4'
}

/** Portuguese label e.g. Q4 → "4º trimestre". */
export function quarterOrdinalLabel(quarter: string): string {
  const n = normalizeQuarter(quarter)
  const map: Record<string, string> = {
    Q1: '1º trimestre',
    Q2: '2º trimestre',
    Q3: '3º trimestre',
    Q4: '4º trimestre',
  }
  return map[n] ?? `${n} trimestre`
}
