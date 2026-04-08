'use client'

import {
  filterByQuarter,
  quarterOrdinalLabel,
  uniqueQuarters,
  yearsForQuarter,
} from '@/src/components/mercado/abfChartFilters'
import AbfForecastNotice from '@/src/components/mercado/AbfForecastNotice'
import { ABF_SEGMENT_COLORS } from '@/src/components/mercado/abfSegmentColors'
import FormSelect from '@/src/components/ui/FormSelect'
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/src/components/ui/chart'
import Skeleton from '@/src/components/ui/skeletons/Skeleton'
import { useAbfSegments } from '@/src/hooks/abfSegments/useAbfSegments'
import { isAbfYearQuarterForecast } from '@/src/utils/abfQuarterForecast'
import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

const MAX_LINE_SEGMENTS = 6

type Segment = { acronym: string; segment: string }

export type SegmentsEvolutionComparisonLineChartProps = {
  globalQuarter: string
  onGlobalQuarterChange: (quarter: string) => void
}

/**
 * Comparativo temporal: vários segmentos no mesmo período (trimestre global).
 * Largura total da área de conteúdo, abaixo do gráfico de evolução simples.
 */
export default function SegmentsEvolutionComparisonLineChart({
  globalQuarter,
  onGlobalQuarterChange,
}: SegmentsEvolutionComparisonLineChartProps) {
  const { data: entries = [], isPending } = useAbfSegments({})

  const filtered = useMemo(
    () => filterByQuarter(entries, globalQuarter),
    [entries, globalQuarter],
  )

  const yearStrings = useMemo(
    () => yearsForQuarter(entries, globalQuarter).map(String),
    [entries, globalQuarter],
  )

  const quarterOptions = useMemo(
    () =>
      uniqueQuarters(entries).map((q) => ({
        value: q,
        label: q,
      })),
    [entries],
  )

  const segments = useMemo(() => {
    const map = new Map<string, Segment>()
    for (const e of filtered) {
      if (!map.has(e.acronym))
        map.set(e.acronym, { acronym: e.acronym, segment: e.segment })
    }
    return Array.from(map.values()).sort((a, b) =>
      a.acronym.localeCompare(b.acronym),
    )
  }, [filtered])

  const [selectedAcronyms, setSelectedAcronyms] = useState<string[]>(['ACD'])

  useEffect(() => {
    if (!segments.length) return
    setSelectedAcronyms((prev) => {
      const valid = prev.filter((a) => segments.some((s) => s.acronym === a))
      if (valid.length === 0) return [segments[0]!.acronym]
      return valid.slice(0, MAX_LINE_SEGMENTS)
    })
  }, [segments])

  const toggleAcronym = (acronym: string) => {
    setSelectedAcronyms((prev) => {
      if (prev.includes(acronym)) {
        if (prev.length <= 1) return prev
        return prev.filter((a) => a !== acronym)
      }
      if (prev.length >= MAX_LINE_SEGMENTS) return prev
      return [...prev, acronym]
    })
  }

  const chartConfig = useMemo(() => {
    const c = {} as ChartConfig
    selectedAcronyms.forEach((ac, i) => {
      const seg = segments.find((s) => s.acronym === ac)
      c[ac] = {
        label: seg ? `${ac} – ${seg.segment}` : ac,
        color: ABF_SEGMENT_COLORS[i % ABF_SEGMENT_COLORS.length],
      }
    })
    return c
  }, [selectedAcronyms, segments])

  const chartData = useMemo(() => {
    return yearStrings.map((year) => {
      const row: Record<string, string | number | null> = { year }
      for (const ac of selectedAcronyms) {
        const found = filtered.find(
          (s) => s.year === Number(year) && s.acronym === ac,
        )
        row[ac] = found?.value ?? null
      }
      return row
    })
  }, [yearStrings, filtered, selectedAcronyms])

  const showForecastNotice = useMemo(
    () =>
      yearStrings.some((y) =>
        isAbfYearQuarterForecast(Number(y), globalQuarter),
      ),
    [yearStrings, globalQuarter],
  )

  const formatValue = (value: number) =>
    value === 0
      ? 'R$ 0'
      : value >= 1000
        ? `R$ ${(value / 1000).toFixed(2)}bi`
        : `R$ ${value}MM`

  const yearRangeLabel =
    yearStrings.length === 0
      ? ''
      : yearStrings.length === 1
        ? yearStrings[0]
        : `${yearStrings[0]} a ${yearStrings[yearStrings.length - 1]}`

  if (isPending) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
        <Skeleton className="h-[380px] w-full" />
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-foreground">
            Comparativo entre segmentos
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {quarterOrdinalLabel(globalQuarter)}
            {yearRangeLabel ? ` · ${yearRangeLabel}` : ''} (R$ MM). Marque até{' '}
            {MAX_LINE_SEGMENTS} segmentos para comparar a evolução no mesmo
            trimestre.
          </p>
        </div>
        <div className="w-28 shrink-0">
          <FormSelect
            name="evolution-comparison-quarter"
            value={globalQuarter}
            options={quarterOptions}
            onChange={(e) => onGlobalQuarterChange(e.target.value)}
          />
        </div>
      </div>

      {showForecastNotice ? (
        <div className="mb-4">
          <AbfForecastNotice />
        </div>
      ) : null}

      <div className="rounded-lg border border-border bg-muted/20 p-3 max-h-36 overflow-y-auto mb-6">
        <p className="text-xs text-muted-foreground mb-2">Segmentos</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {segments.map((s) => {
            const checked = selectedAcronyms.includes(s.acronym)
            const atMax =
              !checked && selectedAcronyms.length >= MAX_LINE_SEGMENTS
            return (
              <label
                key={s.acronym}
                className="flex items-center gap-2 text-sm cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  className="rounded border-border"
                  checked={checked}
                  disabled={atMax}
                  onChange={() => toggleAcronym(s.acronym)}
                />
                <span className="text-foreground">
                  {s.acronym} – {s.segment}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      <ChartContainer config={chartConfig} className="h-[380px] w-full min-w-0">
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={{ top: 8, left: 8, right: 8, bottom: 8 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={formatValue}
            width={95}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelKey="year"
                valueFormatter={(value) => formatValue(Number(value))}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          {selectedAcronyms.map((ac) => (
            <Line
              key={ac}
              type="linear"
              dataKey={ac}
              stroke={`var(--color-${ac})`}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  )
}
