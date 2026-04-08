'use client'

import * as React from 'react'
import * as RechartsPrimitive from 'recharts'

type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType<{ className?: string }>
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<string, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error('useChart must be used within a ChartContainer')
  }
  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    config: ChartConfig
    children: React.ReactElement
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`

  const colorVars = React.useMemo(() => {
    return Object.entries(config).reduce<Record<string, string>>(
      (acc, [key, itemConfig]) => {
        const color = itemConfig.theme?.light ?? itemConfig.color ?? undefined
        if (color) acc[`--color-${key}`] = color
        return acc
      },
      {},
    )
  }, [config])

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={ref}
        data-chart={chartId}
        className={className}
        style={colorVars}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = 'ChartContainer'

const ChartTooltip = RechartsPrimitive.Tooltip

function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string,
) {
  if (typeof payload !== 'object' || payload === null) return undefined
  const payloadPayload =
    'payload' in payload &&
    typeof (payload as { payload?: unknown }).payload === 'object' &&
    (payload as { payload?: unknown }).payload !== null
      ? (payload as { payload: Record<string, unknown> }).payload
      : undefined
  let configLabelKey: string = key
  const p = payload as Record<string, unknown>
  if (key in p && typeof p[key] === 'string') {
    configLabelKey = p[key] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof (payloadPayload as Record<string, unknown>)[key] === 'string'
  ) {
    configLabelKey = (payloadPayload as Record<string, unknown>)[key] as string
  }
  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

interface ChartTooltipContentProps extends React.ComponentProps<'div'> {
  active?: boolean
  payload?: Array<{
    name?: string
    value?: unknown
    dataKey?: string
    color?: string
    payload?: Record<string, unknown>
  }>
  label?: string
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: 'line' | 'dot' | 'dashed'
  nameKey?: string
  labelKey?: string
  labelFormatter?: (value: unknown, payload: unknown[]) => React.ReactNode
  valueFormatter?: (value: unknown, name: unknown, item: unknown) => string
  formatter?: (
    value: unknown,
    name: unknown,
    item: unknown,
    index: number,
    payload: unknown,
  ) => React.ReactNode
}

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(
  (
    {
      active,
      payload,
      className = '',
      indicator = 'dot',
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      valueFormatter,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref,
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) return null
      const [item] = payload
      const key = `${labelKey || (item?.dataKey as string) || item?.name || 'value'}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value =
        !labelKey && typeof label === 'string'
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label
      if (labelFormatter) {
        return labelFormatter(value, payload)
      }
      if (!value) return null
      return value
    }, [label, labelFormatter, payload, hideLabel, config, labelKey])

    if (!active || !payload?.length) return null

    const nestLabel = payload.length === 1 && indicator !== 'dot'

    return (
      <div
        ref={ref}
        className={`border-border/50 bg-background grid min-w-[10rem] max-w-[18rem] break-words items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl transition-all ${className}`}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || 'value'}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor =
              color || (item.payload as { fill?: string })?.fill || item.color

            return (
              <div
                key={index}
                className="text-foreground flex w-full items-stretch gap-2"
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(
                    item.value,
                    item.name,
                    item,
                    index,
                    (item as { payload?: unknown }).payload,
                  )
                ) : (
                  <>
                    {!hideIndicator && (
                      <div
                        className={`shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg] ${
                          indicator === 'dot'
                            ? 'h-2.5 w-2.5'
                            : indicator === 'line'
                              ? 'w-1'
                              : 'w-0 border-[1.5px] border-dashed bg-transparent'
                        } ${nestLabel && indicator === 'dashed' ? 'my-0.5' : ''}`}
                        style={
                          {
                            '--color-bg': indicatorColor,
                            '--color-border': indicatorColor,
                          } as React.CSSProperties
                        }
                      />
                    )}
                    <div
                      className={`flex flex-1 gap-3 ${
                        nestLabel ? 'items-end' : 'items-center'
                      }`}
                    >
                      <div className="grid gap-1.5 min-w-0 flex-1">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground break-words whitespace-normal">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value != null && (
                        <span className="font-mono font-medium tabular-nums shrink-0">
                          {valueFormatter
                            ? valueFormatter(
                                item.value,
                                item.name,
                                item as unknown,
                              )
                            : item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  },
)
ChartTooltipContent.displayName = 'ChartTooltipContent'

const ChartLegend = RechartsPrimitive.Legend

interface ChartLegendContentProps extends React.ComponentProps<'div'> {
  payload?: Array<{
    value?: string
    dataKey?: string
    color?: string
    type?: string
  }>
  verticalAlign?: 'top' | 'bottom' | 'middle'
  hideIcon?: boolean
  nameKey?: string
}

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  ChartLegendContentProps
>(
  (
    {
      className = '',
      hideIcon = false,
      payload,
      verticalAlign = 'bottom',
      nameKey,
    },
    ref,
  ) => {
    const { config } = useChart()

    if (!payload?.length) return null

    return (
      <div
        ref={ref}
        className={`flex items-center justify-center gap-4 ${verticalAlign === 'top' ? 'pb-3' : 'pt-3'} ${className}`}
      >
        {payload.map((item) => {
          const key = nameKey || item.dataKey || item.value || 'value'
          const itemConfig = config[key as keyof typeof config]
          return (
            <div
              key={item.value}
              className="flex items-center gap-1.5 text-muted-foreground text-xs"
            >
              {!hideIcon && (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: item.color }}
                />
              )}
              {itemConfig?.label ?? item.value}
            </div>
          )
        })}
      </div>
    )
  },
)
ChartLegendContent.displayName = 'ChartLegendContent'

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  useChart,
  type ChartConfig,
}
