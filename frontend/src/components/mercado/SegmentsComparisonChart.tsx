'use client'

import {
  filterByQuarter,
  quarterOrdinalLabel,
  uniqueQuarters,
} from '@/src/components/mercado/abfChartFilters'
import AbfForecastNotice from '@/src/components/mercado/AbfForecastNotice'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from '@/src/components/ui/chart'
import FormSelect from '@/src/components/ui/FormSelect'
import Skeleton from '@/src/components/ui/skeletons/Skeleton'
import { useAbfSegments } from '@/src/hooks/abfSegments/useAbfSegments'
import { isAbfYearQuarterForecast } from '@/src/utils/abfQuarterForecast'
import * as React from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

const chartConfig = {
  yearA: {
    label: 'Ano A',
    color: 'var(--color-primary)',
  },
  yearB: {
    label: 'Ano B',
    color: 'hsl(220 9% 46%)',
  },
} satisfies ChartConfig

function formatValue(value: number) {
  return value >= 1000 ? `R$ ${(value / 1000).toFixed(2)}bi` : `R$ ${value}MM`
}

interface TooltipPayloadItem {
  name?: string
  value?: unknown
  dataKey?: string
  color?: string
  payload?: {
    acronym: string
    segment: string
    yearA: number | null
    yearB: number | null
  }
}

function AdvancedTooltip({
  active,
  payload,
  yearALabel,
  yearBLabel,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  yearALabel: string
  yearBLabel: string
}) {
  if (!active || !payload?.length) return null

  const row = payload[0]?.payload
  if (!row) return null

  const pct =
    row.yearA && row.yearB
      ? (((row.yearB - row.yearA) / row.yearA) * 100).toFixed(1)
      : null

  return (
    <div className="border-border/50 bg-background rounded-lg border px-3 py-2 text-xs shadow-xl min-w-[11rem]">
      <p className="font-semibold text-foreground mb-2">{row.segment}</p>
      <div className="grid gap-1.5">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <span
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: 'var(--color-primary)' }}
            />
            {yearALabel}
          </span>
          <span className="font-mono tabular-nums">
            {row.yearA != null ? formatValue(row.yearA) : '—'}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <span
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: 'hsl(220 9% 46%)' }}
            />
            {yearBLabel}
          </span>
          <span className="font-mono tabular-nums">
            {row.yearB != null ? formatValue(row.yearB) : '—'}
          </span>
        </div>
        {pct !== null && (
          <div className="border-t border-border mt-1 pt-1 flex justify-between gap-4">
            <span className="text-muted-foreground">Variação</span>
            <span
              className={`font-mono font-semibold tabular-nums ${
                Number(pct) >= 0 ? 'text-success' : 'text-destructive'
              }`}
            >
              {Number(pct) >= 0 ? '+' : ''}
              {pct}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export type SegmentsComparisonChartProps = {
  globalQuarter: string
  onGlobalQuarterChange: (quarter: string) => void
}

export default function SegmentsComparisonChart({
  globalQuarter,
  onGlobalQuarterChange,
}: SegmentsComparisonChartProps) {
  const [yearA, setYearA] = React.useState('2022')
  const [yearB, setYearB] = React.useState('2023')

  const { data: entries = [], isPending } = useAbfSegments({})
  const filtered = React.useMemo(
    () => filterByQuarter(entries, globalQuarter),
    [entries, globalQuarter],
  )

  const quarterOptions = React.useMemo(
    () =>
      uniqueQuarters(entries).map((q) => ({
        value: q,
        label: q,
      })),
    [entries],
  )

  const allYears = React.useMemo(() => {
    return Array.from(new Set(filtered.map((e) => String(e.year)))).sort()
  }, [filtered])

  React.useEffect(() => {
    if (!allYears.length) return
    if (!allYears.includes(yearA)) setYearA(allYears[0]!)
    if (!allYears.includes(yearB)) {
      setYearB(allYears[1] ?? allYears[0]!)
    }
  }, [allYears, yearA, yearB])

  const makeOptions = React.useCallback(
    (exclude: string) =>
      allYears
        .filter((y) => y !== exclude)
        .map((y) => ({ value: y, label: y })),
    [allYears],
  )

  const chartData = React.useMemo(() => {
    const segmentsA = filtered.filter((e) => e.year === Number(yearA))
    const segmentsB = filtered.filter((e) => e.year === Number(yearB))

    const acronyms = Array.from(
      new Set([...segmentsA, ...segmentsB].map((s) => s.acronym)),
    ).sort()

    return acronyms.map((acronym) => {
      const a = segmentsA.find((s) => s.acronym === acronym)
      const b = segmentsB.find((s) => s.acronym === acronym)
      return {
        acronym,
        segment: a?.segment ?? b?.segment ?? acronym,
        yearA: a?.value ?? null,
        yearB: b?.value ?? null,
      }
    })
  }, [filtered, yearA, yearB])

  const activeConfig = {
    ...chartConfig,
    yearA: { ...chartConfig.yearA, label: yearA },
    yearB: { ...chartConfig.yearB, label: yearB },
  }

  const showForecastNotice =
    isAbfYearQuarterForecast(Number(yearA), globalQuarter) ||
    isAbfYearQuarterForecast(Number(yearB), globalQuarter)

  if (isPending) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
        <Skeleton className="h-[320px] w-full" />
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Comparação entre Anos
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Faturamento por segmento no {quarterOrdinalLabel(globalQuarter)} —
            passe o mouse para ver a variação
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0 justify-end">
          <div className="w-28">
            <FormSelect
              name="comparison-quarter"
              value={globalQuarter}
              options={quarterOptions}
              onChange={(e) => onGlobalQuarterChange(e.target.value)}
            />
          </div>
          <div className="w-28">
            <FormSelect
              name="yearA"
              value={yearA}
              options={makeOptions(yearB)}
              onChange={(e) => setYearA(e.target.value)}
            />
          </div>
          <span className="text-muted-foreground text-sm">vs</span>
          <div className="w-28">
            <FormSelect
              name="yearB"
              value={yearB}
              options={makeOptions(yearA)}
              onChange={(e) => setYearB(e.target.value)}
            />
          </div>
        </div>
      </div>
      {showForecastNotice ? (
        <div className="mb-4">
          <AbfForecastNotice />
        </div>
      ) : null}
      <ChartContainer
        config={activeConfig}
        className="h-[320px] w-full min-w-0"
      >
        <BarChart
          accessibilityLayer
          data={chartData}
          margin={{ left: 16, right: 8, top: 8, bottom: 8 }}
          barCategoryGap="20%"
          barGap={4}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="acronym"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={95}
            tickFormatter={formatValue}
          />
          <ChartTooltip
            content={<AdvancedTooltip yearALabel={yearA} yearBLabel={yearB} />}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="yearA"
            fill="var(--color-yearA)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="yearB"
            fill="var(--color-yearB)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
