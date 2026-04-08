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
import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'

const chartConfig = {
  total: {
    label: 'Faturamento Total',
    color: 'var(--color-primary)',
  },
} satisfies ChartConfig

export type SegmentsTotalBarChartProps = {
  globalQuarter: string
  onGlobalQuarterChange: (quarter: string) => void
}

export default function SegmentsTotalBarChart({
  globalQuarter,
  onGlobalQuarterChange,
}: SegmentsTotalBarChartProps) {
  const { data: entries = [], isPending } = useAbfSegments({})

  const quarterFiltered = useMemo(
    () => filterByQuarter(entries, globalQuarter),
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

  const yearStrings = useMemo(
    () => yearsForQuarter(entries, globalQuarter).map(String),
    [entries, globalQuarter],
  )

  const chartData = useMemo(() => {
    return yearStrings.map((year) => {
      const segments = quarterFiltered.filter((s) => s.year === Number(year))
      const total = segments.reduce((sum, s) => sum + s.value, 0)
      return { year, total }
    })
  }, [quarterFiltered, yearStrings])

  const showForecastNotice = useMemo(
    () =>
      yearStrings.some((y) =>
        isAbfYearQuarterForecast(Number(y), globalQuarter),
      ),
    [yearStrings, globalQuarter],
  )

  const formatValue = (value: number) => {
    if (value === 0) return 'R$ 0'
    return value >= 1000 ? `R$ ${(value / 1000).toFixed(1)}bi` : `R$ ${value}MM`
  }

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
            Faturamento Total por Ano
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Soma de todos os segmentos no {quarterOrdinalLabel(globalQuarter)}{' '}
            (R$ MM)
          </p>
        </div>
        <div className="w-28 shrink-0">
          <FormSelect
            name="segment-total-quarter"
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
      <ChartContainer config={chartConfig} className="h-[280px] w-full min-w-0">
        <BarChart
          accessibilityLayer
          data={chartData}
          margin={{ top: 24, left: 8, right: 8, bottom: 8 }}
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
            width={80}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelKey="year"
                valueFormatter={(value) => formatValue(Number(value))}
              />
            }
          />
          <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]}>
            <LabelList
              dataKey="total"
              position="top"
              formatter={(value: unknown) => formatValue(Number(value))}
              className="fill-foreground text-xs font-medium"
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  )
}
