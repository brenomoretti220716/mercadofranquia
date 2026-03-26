"use client"

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ReferenceArea, Legend,
} from "recharts"
import { Card, CardContent } from "@/components/ui/card"

// ── Constantes ──────────────────────────────────────────────────────────────

const COR_ICC = "#1D9E75"
const COR_ICE = "#378ADD"
const COR_ENDIV = "#D85A30"
const COR_MASSA = "#534AB7"

const CARD_STYLE = {
  background: "#fff",
  border: "0.5px solid rgba(0,0,0,0.08)",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
}

// ── Tipos ───────────────────────────────────────────────────────────────────

interface SerieItem {
  data: string
  nome_serie: string
  valor: number
}

interface PainelData {
  icc: { dados: SerieItem[] }
  ice: { dados: SerieItem[] }
  endividamento: { dados: SerieItem[] }
  massa_salarial: { dados: SerieItem[] }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatMes(data: string): string {
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  const [ano, mes] = data.split("-")
  return `${meses[parseInt(mes) - 1]}/${ano.slice(2)}`
}

function ultimoEVar12m(dados: SerieItem[]): { atual: number; var12m: number | null } {
  if (dados.length === 0) return { atual: 0, var12m: null }
  const sorted = [...dados].sort((a, b) => a.data.localeCompare(b.data))
  const atual = sorted[sorted.length - 1].valor
  const ref = sorted.length > 12 ? sorted[sorted.length - 13].valor : null
  const var12m = ref ? +((atual / ref - 1) * 100).toFixed(1) : null
  return { atual, var12m }
}

// ── KPI Card ────────────────────────────────────────────────────────────────

function KpiConsumidor({
  titulo,
  valor,
  variacao,
  cor,
  sufixo,
  badge,
}: {
  titulo: string
  valor: string
  variacao: number | null
  cor: string
  sufixo?: string
  badge?: { texto: string; bg: string; color: string } | null
}) {
  const varPositiva = variacao !== null && variacao >= 0
  return (
    <Card className="border-0 shadow-none" style={CARD_STYLE}>
      <CardContent className="p-4">
        <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#aaa" }}>
          {titulo}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-semibold" style={{ color: "#1a1a18" }}>
            {valor}{sufixo}
          </span>
          {variacao !== null && (
            <span className="text-[11px] font-medium" style={{ color: varPositiva ? COR_ICC : COR_ENDIV }}>
              {varPositiva ? "\u25B2" : "\u25BC"} {Math.abs(variacao)}%
            </span>
          )}
        </div>
        {badge && (
          <div
            className="inline-block text-[10px] font-medium rounded-full px-2 py-0.5 mt-2"
            style={{ background: badge.bg, color: badge.color }}
          >
            {badge.texto}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Mini gráfico de linha ───────────────────────────────────────────────────

function MiniLinha({
  titulo,
  dados,
  cor,
  formatY,
}: {
  titulo: string
  dados: { mes: string; valor: number }[]
  cor: string
  formatY: (v: number) => string
}) {
  const step = Math.max(1, Math.floor(dados.length / 6))
  return (
    <Card className="border-0 shadow-none" style={CARD_STYLE}>
      <CardContent className="p-5">
        <div className="text-[11px] uppercase tracking-[0.07em] font-medium mb-3" style={{ color: "#aaa" }}>
          {titulo}
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={dados} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0efe9" />
            <XAxis
              dataKey="mes"
              tick={{ fontSize: 9, fill: "#ccc" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatMes}
              interval={step}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "#ccc" }}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
              tickFormatter={(v: number) => formatY(v)}
            />
            <Tooltip
              formatter={(value) => [formatY(Number(value)), titulo]}
              labelFormatter={(label) => formatMes(String(label))}
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #eee" }}
            />
            <Line
              type="monotone"
              dataKey="valor"
              stroke={cor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ── Componente principal ────────────────────────────────────────────────────

export function PainelConsumidor({ painel }: { painel: PainelData }) {
  const iccStats = ultimoEVar12m(painel.icc.dados)
  const iceStats = ultimoEVar12m(painel.ice.dados)
  const endivStats = ultimoEVar12m(painel.endividamento.dados)
  const massaStats = ultimoEVar12m(painel.massa_salarial.dados)

  // Insight automático baseado no ICC
  const iccAtual = iccStats.atual
  const insightBadge = iccAtual >= 100
    ? { texto: "Ambiente favoravel para franquias", bg: "#E1F5EE", color: "#0F6E56" }
    : iccAtual < 90
      ? { texto: "Momento de cautela", bg: "#FCEBEB", color: "#A32D2D" }
      : null

  // Badge de alerta endividamento
  const endivBadge = endivStats.atual > 45
    ? { texto: `Alerta: ${endivStats.atual.toFixed(1)}% da renda`, bg: "#FEF3E2", color: "#92610E" }
    : null

  // Massa salarial: converter de R$ (valor absoluto) para R$ bilhões
  const massaBi = massaStats.atual / 1_000_000

  // Séries para gráfico ICC vs ICE
  const iccSorted = [...painel.icc.dados].sort((a, b) => a.data.localeCompare(b.data))
  const iceSorted = [...painel.ice.dados].sort((a, b) => a.data.localeCompare(b.data))

  const mesMap = new Map<string, { mes: string; icc: number | null; ice: number | null }>()
  for (const d of iccSorted) {
    const mes = d.data.slice(0, 7)
    if (!mesMap.has(mes)) mesMap.set(mes, { mes, icc: null, ice: null })
    mesMap.get(mes)!.icc = d.valor
  }
  for (const d of iceSorted) {
    const mes = d.data.slice(0, 7)
    if (!mesMap.has(mes)) mesMap.set(mes, { mes, icc: null, ice: null })
    mesMap.get(mes)!.ice = d.valor
  }
  const serieConfianca = [...mesMap.values()].sort((a, b) => a.mes.localeCompare(b.mes))

  // Séries para mini gráficos
  const endivSerie = [...painel.endividamento.dados]
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((d) => ({ mes: d.data.slice(0, 7), valor: d.valor }))

  const massaSerie = [...painel.massa_salarial.dados]
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((d) => ({ mes: d.data.slice(0, 7), valor: d.valor / 1_000_000 }))

  const stepConf = Math.max(1, Math.floor(serieConfianca.length / 8))

  return (
    <div className="flex flex-col gap-4">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiConsumidor
          titulo="Confianca do Consumidor (ICC)"
          valor={iccStats.atual.toFixed(1)}
          variacao={iccStats.var12m}
          cor={COR_ICC}
          badge={insightBadge}
        />
        <KpiConsumidor
          titulo="Confianca Empresarial (ICE)"
          valor={iceStats.atual.toFixed(1)}
          variacao={iceStats.var12m}
          cor={COR_ICE}
        />
        <KpiConsumidor
          titulo="Endividamento das familias"
          valor={endivStats.atual.toFixed(1)}
          variacao={endivStats.var12m}
          cor={COR_ENDIV}
          sufixo="%"
          badge={endivBadge}
        />
        <KpiConsumidor
          titulo="Massa salarial real"
          valor={`R$ ${massaBi.toFixed(0)}`}
          variacao={massaStats.var12m}
          cor={COR_MASSA}
          sufixo=" bi"
        />
      </div>

      {/* Gráfico ICC vs ICE */}
      <Card className="border-0 shadow-none" style={CARD_STYLE}>
        <CardContent className="p-6">
          <div className="text-[11px] uppercase tracking-[0.07em] font-medium mb-4" style={{ color: "#aaa" }}>
            Confianca do Consumidor vs Empresarial (FGV)
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={serieConfianca} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0efe9" />
              {/* Área sombreada 2020 (COVID / queda do franchising) */}
              <ReferenceArea x1="2020-01" x2="2020-12" fill="#E24B4A" fillOpacity={0.06} />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 10, fill: "#bbb" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatMes}
                interval={stepConf}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#bbb" }}
                tickLine={false}
                axisLine={false}
                domain={["auto", "auto"]}
              />
              <Tooltip
                formatter={(value, name) => [
                  Number(value).toFixed(1),
                  name === "icc" ? "ICC (Consumidor)" : "ICE (Empresarial)",
                ]}
                labelFormatter={(label) => formatMes(String(label))}
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #eee" }}
              />
              <Legend
                formatter={(value) =>
                  value === "icc" ? "ICC — Consumidor" : "ICE — Empresarial"
                }
                wrapperStyle={{ fontSize: 11 }}
              />
              <Line
                type="monotone"
                dataKey="icc"
                stroke={COR_ICC}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="ice"
                stroke={COR_ICE}
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-[10px] mt-2 text-center" style={{ color: "#ccc" }}>
            Area vermelha = 2020 (COVID) · Fonte: FGV via BCB
          </div>
        </CardContent>
      </Card>

      {/* Mini gráficos: Endividamento + Massa Salarial */}
      <div className="grid grid-cols-2 gap-4">
        <MiniLinha
          titulo="Endividamento das familias (% da renda)"
          dados={endivSerie}
          cor={COR_ENDIV}
          formatY={(v) => `${v.toFixed(0)}%`}
        />
        <MiniLinha
          titulo="Massa salarial real (R$ bilhoes)"
          dados={massaSerie}
          cor={COR_MASSA}
          formatY={(v) => `${v.toFixed(0)}`}
        />
      </div>
    </div>
  )
}
