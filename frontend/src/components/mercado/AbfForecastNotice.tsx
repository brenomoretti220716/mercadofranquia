'use client'

import AlertTriangleIcon from '@/src/components/icons/alertTriangleIcon'

type AbfForecastNoticeProps = {
  className?: string
  /** e.g. compact line height for table/toolbars */
  variant?: 'default' | 'compact'
}

export default function AbfForecastNotice({
  className = '',
  variant = 'default',
}: AbfForecastNoticeProps) {
  const gap = variant === 'compact' ? 'gap-2' : 'gap-3'
  const iconSize = variant === 'compact' ? 16 : 18

  return (
    <div
      role="status"
      className={`flex items-start ${gap} rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2.5 text-sm text-foreground ${className}`}
    >
      <AlertTriangleIcon
        className="shrink-0 text-amber-600 dark:text-amber-500 mt-0.5"
        width={iconSize}
        height={iconSize}
        aria-hidden
      />
      <p className="leading-snug text-muted-foreground">
        <span className="font-medium text-foreground">Atenção:</span> Dados de
        períodos superiores ao trimestre atual são previsões do mercado.
      </p>
    </div>
  )
}
