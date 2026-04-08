'use client'

import {
  filterByQuarter,
  quarterOrdinalLabel,
  uniqueQuarters,
  yearsForQuarter,
} from '@/src/components/mercado/abfChartFilters'
import AbfForecastNotice from '@/src/components/mercado/AbfForecastNotice'
import FormSelect from '@/src/components/ui/FormSelect'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/src/components/ui/chart'
import Skeleton from '@/src/components/ui/skeletons/Skeleton'
import { useAbfSegments } from '@/src/hooks/abfSegments/useAbfSegments'
import { isAbfYearQuarterForecast } from '@/src/utils/abfQuarterForecast'
import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

type Segment = { acronym: string; segment: string }

const chartConfig = {
  value: {
    label: 'Faturamento (R$ MM)',
    color: 'var(--color-primary)',
  },
} satisfies ChartConfig

export type SegmentsEvolutionLineChartProps = {
  globalQuarter: string
  onGlobalQuarterChange: (quarter: string) => void
}

export default function SegmentsEvolutionLineChart({
  globalQuarter,
  onGlobalQuarterChange,
}: SegmentsEvolutionLineChartProps) {
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

  const [acronym, setAcronym] = useState('ACD')

  useEffect(() => {
    if (!segments.length) return
    if (segments.some((s) => s.acronym === acronym)) return
    setAcronym(segments[0]!.acronym)
  }, [segments, acronym])

  const selectedSegment = segments.find((s) => s.acronym === acronym)

  const segmentOptions = segments.map((s) => ({
    value: s.acronym,
    label: `${s.acronym} – ${s.segment}`,
  }))

  const chartData = useMemo(() => {
    return yearStrings.map((year) => {
      const found = filtered.find(
        (s) => s.year === Number(year) && s.acronym === acronym,
      )
      return { year, value: found?.value ?? null }
    })
  }, [acronym, filtered, yearStrings])

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
        <Skeleton className="h-[280px] w-full" />
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Evolução por Segmento
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {selectedSegment?.segment ?? acronym}
            {yearRangeLabel ? ` · ${yearRangeLabel}` : ''} ·{' '}
            {quarterOrdinalLabel(globalQuarter)} (R$ MM)
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0 justify-end">
          <div className="w-28 shrink-0">
            <FormSelect
              name="evolution-quarter"
              value={globalQuarter}
              options={quarterOptions}
              onChange={(e) => onGlobalQuarterChange(e.target.value)}
            />
          </div>
          <div className="w-48 shrink-0 min-w-0">
            <FormSelect
              name="evolution-segment"
              value={acronym}
              options={segmentOptions}
              onChange={(e) => setAcronym(e.target.value)}
            />
          </div>
        </div>
      </div>
      {showForecastNotice ? (
        <div className="mb-4">
          <AbfForecastNotice />
        </div>
      ) : null}
      <ChartContainer config={chartConfig} className="h-[280px] w-full min-w-0">
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
          <Line
            type="linear"
            dataKey="value"
            stroke="var(--color-value)"
            strokeWidth={2}
            dot={{ fill: 'var(--color-value)', r: 4 }}
            activeDot={{ r: 6 }}
            connectNulls
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}
