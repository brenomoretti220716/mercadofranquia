'use client'

import {
  filterByYearAndQuarter,
  quarterOrdinalLabel,
  quartersForYear,
  uniqueYears,
} from '@/src/components/mercado/abfChartFilters'
import AbfForecastNotice from '@/src/components/mercado/AbfForecastNotice'
import { ABF_SEGMENT_COLORS } from '@/src/components/mercado/abfSegmentColors'
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
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'

export default function SegmentsSharePieChart() {
  const [year, setYear] = useState('2023')
  const [quarter, setQuarter] = useState('Q4')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)')
    const update = () => setIsMobile(media.matches)
    update()

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', update)
      return () => media.removeEventListener('change', update)
    }

    type LegacyMediaQueryList = {
      matches: boolean
      addListener?: (listener: () => void) => void
      removeListener?: (listener: () => void) => void
    }

    const legacyMedia = media as unknown as LegacyMediaQueryList
    legacyMedia.addListener?.(update)
    return () => legacyMedia.removeListener?.(update)
  }, [])

  const { data: entries = [], isPending } = useAbfSegments({})

  const yearOptions = useMemo(() => {
    const years = uniqueYears(entries)
    return years.map((y) => ({ value: String(y), label: String(y) }))
  }, [entries])

  const quarterOptions = useMemo(() => {
    return quartersForYear(entries, Number(year)).map((q) => ({
      value: q,
      label: q,
    }))
  }, [entries, year])

  useEffect(() => {
    if (!yearOptions.length) return
    if (yearOptions.some((o) => o.value === year)) return
    setYear(yearOptions[yearOptions.length - 1]!.value)
  }, [yearOptions, year])

  useEffect(() => {
    const qs = quartersForYear(entries, Number(year))
    if (!qs.length) return
    if (!qs.includes(quarter)) setQuarter(qs[qs.length - 1]!)
  }, [year, entries, quarter])

  const { chartData, chartConfig } = useMemo(() => {
    const segments = filterByYearAndQuarter(entries, Number(year), quarter)
    const total = segments.reduce((sum, s) => sum + s.value, 0)

    const sortedSegments = [...segments].sort((a, b) => b.value - a.value)

    const data = sortedSegments.map((s, i) => ({
      acronym: s.acronym,
      segment: s.segment,
      value: s.value,
      pct: total > 0 ? ((s.value / total) * 100).toFixed(1) : '0',
      fill: ABF_SEGMENT_COLORS[i % ABF_SEGMENT_COLORS.length],
    }))

    const config = Object.fromEntries(
      sortedSegments.map((s, i) => [
        s.acronym,
        {
          label: s.segment,
          color: ABF_SEGMENT_COLORS[i % ABF_SEGMENT_COLORS.length],
        },
      ]),
    ) as ChartConfig

    return { chartData: data, chartConfig: config }
  }, [entries, year, quarter])

  if (isPending) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
        <Skeleton className="h-[320px] w-full" />
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Participação por Segmento
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Distribuição do faturamento no {quarterOrdinalLabel(quarter)} de{' '}
            {year}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0 justify-end">
          <div className="w-32 shrink-0">
            <FormSelect
              name="year"
              value={year}
              options={yearOptions}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
          <div className="w-28 shrink-0">
            <FormSelect
              name="quarter"
              value={quarter}
              options={quarterOptions}
              onChange={(e) => setQuarter(e.target.value)}
            />
          </div>
        </div>
      </div>
      {isAbfYearQuarterForecast(Number(year), quarter) ? (
        <div className="mb-4">
          <AbfForecastNotice />
        </div>
      ) : null}
      <ChartContainer config={chartConfig} className="h-[320px] w-full min-w-0">
        <BarChart
          accessibilityLayer
          data={chartData}
          layout="vertical"
          margin={{
            left: isMobile ? 0 : 8,
            right: 8,
            top: 8,
            bottom: 8,
          }}
          barCategoryGap="12%"
        >
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="value"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) =>
              value >= 1000
                ? `R$ ${(value / 1000).toFixed(2)} bi`
                : `R$ ${value}`
            }
          />
          <YAxis
            type="category"
            dataKey="acronym"
            tickLine={false}
            axisLine={false}
            width={isMobile ? 0 : 60}
            interval={0}
            tick={(props) => {
              if (isMobile) return null
              const { x, y, payload } = props
              const label =
                typeof payload === 'object' && payload?.value != null
                  ? payload.value
                  : payload
              return (
                <g transform={`translate(${x},${y})`}>
                  <text
                    textAnchor="end"
                    dominantBaseline="middle"
                    dx={-8}
                    className="fill-foreground text-xs hidden sm:block"
                  >
                    {label}
                  </text>
                </g>
              )
            }}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                nameKey="acronym"
                hideLabel
                valueFormatter={(value, _name, item) => {
                  const row = (item as { payload?: { pct?: string } })?.payload
                  const pct = row?.pct ?? '0'
                  const n = Number(value)
                  const formatted =
                    n >= 1000 ? `R$ ${(n / 1000).toFixed(2)}bi` : `R$ ${n}MM`
                  return `${formatted} (${pct}%)`
                }}
              />
            }
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.acronym} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {chartData.map((item) => (
          <div key={item.acronym} className="flex items-start gap-2 text-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-[2px] mt-1"
              style={{ backgroundColor: item.fill }}
            />
            <span className="text-muted-foreground leading-tight break-words max-w-[12rem] sm:max-w-none">
              {item.segment}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
