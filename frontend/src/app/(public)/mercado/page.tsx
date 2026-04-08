'use client'

import Header from '@/src/components/header/Header'
import {
  defaultGlobalQuarter,
  uniqueQuarters,
} from '@/src/components/mercado/abfChartFilters'
import ABFSegmentsChart from '@/src/components/mercado/ABFSegmentsChart'
import SegmentsComparisonChart from '@/src/components/mercado/SegmentsComparisonChart'
import SegmentsEvolutionComparisonLineChart from '@/src/components/mercado/SegmentsEvolutionComparisonLineChart'
import SegmentsEvolutionLineChart from '@/src/components/mercado/SegmentsEvolutionLineChart'
import SegmentsRadialChart from '@/src/components/mercado/SegmentsRadialChart'
import SegmentsSharePieChart from '@/src/components/mercado/SegmentsSharePieChart'
import SegmentsTotalBarChart from '@/src/components/mercado/SegmentsTotalBarChart'
import { useAbfSegments } from '@/src/hooks/abfSegments/useAbfSegments'
import { useEffect, useState } from 'react'

export default function MercadoPage() {
  const { data: entries = [] } = useAbfSegments({})
  const [globalQuarter, setGlobalQuarter] = useState('Q4')

  useEffect(() => {
    if (!entries.length) return
    const valid = uniqueQuarters(entries)
    if (!valid.includes(globalQuarter)) {
      setGlobalQuarter(defaultGlobalQuarter(entries))
    }
  }, [entries, globalQuarter])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="m-5 md:m-10 space-y-6">
          <div className="text-center space-y-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Mercado de Franquias
              </h1>
              <p className="text-muted-foreground text-lg">
                Análise do mercado de franquias com dados do relatório ABF.
              </p>
            </div>
            <div className="mx-auto max-w-2xl text-left text-sm text-muted-foreground border border-border rounded-lg px-4 py-3 bg-muted/30">
              Os valores são apresentados por trimestre (Q1 a Q4). Nos gráficos
              de faturamento total, evolução simples e comparativa entre
              segmentos, e comparação entre anos, use o trimestre indicado em
              cada card (os três primeiros compartilham o mesmo período global).
              Nos demais gráficos, escolha o ano e o trimestre disponível
              naquele ano.
            </div>
          </div>

          {/* Row 1 — horizontal bar by segment */}
          <ABFSegmentsChart />

          {/* Row 2 — total by year + segment evolution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SegmentsTotalBarChart
              globalQuarter={globalQuarter}
              onGlobalQuarterChange={setGlobalQuarter}
            />
            <SegmentsEvolutionLineChart
              globalQuarter={globalQuarter}
              onGlobalQuarterChange={setGlobalQuarter}
            />
          </div>

          <SegmentsEvolutionComparisonLineChart
            globalQuarter={globalQuarter}
            onGlobalQuarterChange={setGlobalQuarter}
          />

          {/* Row 3 — pie share + radial top segments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SegmentsSharePieChart />
            <SegmentsRadialChart />
          </div>

          {/* Row 4 — year comparison with advanced tooltip */}
          <div className="hidden lg:block">
            <SegmentsComparisonChart
              globalQuarter={globalQuarter}
              onGlobalQuarterChange={setGlobalQuarter}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
