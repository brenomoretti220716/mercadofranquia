"use client"

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell, Legend,
} from "recharts"
import { Card, CardContent } from "@/components/ui/card"

// ── Tipos ───────────────────────────────────────────────────────────────────

interface MacroSerie {
  serie: string
  dados: { data: string; nome_serie: string; valor: number }[]
}

interface FatAnualItem {
  periodo: string
  segmento: string
  valor_mm: number
}

interface PibEstadoItem {
  data: string
  localidade: string
  valor: number
}

// ── Constantes de estilo ────────────────────────────────────────────────────

const COR_PRIMARIA = "#E8421A"
const COR_SECUNDARIA = "#2563EB"
const COR_TERCIARIA = "#534AB7"
const COR_LARANJA = "#F4845F"

const CARD_STYLE = {
  background: "#fff",
  border: "0.5px solid rgba(0,0,0,0.08)",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
}

const CORES_REGIAO: Record<string, string> = {
  "Sudeste": "#E8421A",
  "Sul": "#2563EB",
  "Nordeste": "#D85A30",
  "Centro-Oeste": "#BA7517",
  "Norte": "#534AB7",
}

const ESTADO_REGIAO: Record<string, string> = {
  "São Paulo": "Sudeste", "Rio de Janeiro": "Sudeste", "Minas Gerais": "Sudeste",
  "Espírito Santo": "Sudeste",
  "Paraná": "Sul", "Santa Catarina": "Sul", "Rio Grande do Sul": "Sul",
  "Bahia": "Nordeste", "Pernambuco": "Nordeste", "Ceará": "Nordeste",
  "Maranhão": "Nordeste", "Paraíba": "Nordeste", "Rio Grande do Norte": "Nordeste",
  "Alagoas": "Nordeste", "Sergipe": "Nordeste", "Piauí": "Nordeste",
  "Goiás": "Centro-Oeste", "Mato Grosso": "Centro-Oeste",
  "Mato Grosso do Sul": "Centro-Oeste", "Distrito Federal": "Centro-Oeste",
  "Pará": "Norte", "Amazonas": "Norte", "Rondônia": "Norte",
  "Tocantins": "Norte", "Acre": "Norte", "Amapá": "Norte", "Roraima": "Norte",
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function agruparMensal(dados: MacroSerie["dados"]): { mes: string; valor: number }[] {
  const porMes = new Map<string, number[]>()
  for (const d of dados) {
    const mes = d.data.slice(0, 7) // YYYY-MM
    if (!porMes.has(mes)) porMes.set(mes, [])
    porMes.get(mes)!.push(d.valor)
  }
  return Array.from(porMes.entries())
    .map(([mes, vals]) => ({
      mes,
      valor: vals[vals.length - 1], // último valor do mês
    }))
    .sort((a, b) => a.mes.localeCompare(b.mes))
}

function formatarMes(mes: string): string {
  const [ano, m] = mes.split("-")
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  return `${meses[parseInt(m) - 1]}/${ano.slice(2)}`
}

function selicAnualizada(taxaDiaria: number): number {
  return ((1 + taxaDiaria / 100) ** 252 - 1) * 100
}

// ── Componente: Mini Card de Indicador ──────────────────────────────────────

function MiniIndicador({
  titulo,
  dados,
  cor,
  formatValor,
  sufixo = "",
}: {
  titulo: string
  dados: { mes: string; valor: number }[]
  cor: string
  formatValor: (v: number) => string
  sufixo?: string
}) {
  const atual = dados[dados.length - 1]
  const umAnoAtras = dados.length > 12 ? dados[dados.length - 13] : dados[0]
  const variacao = umAnoAtras
    ? atual.valor - umAnoAtras.valor
    : 0
  const varPositiva = variacao >= 0

  // Mostrar apenas 1 a cada N pontos para não poluir o eixo X
  const step = Math.max(1, Math.floor(dados.length / 6))

  return (
    <Card className="border-0 shadow-none" style={CARD_STYLE}>
      <CardContent className="p-4">
        <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#aaa" }}>
          {titulo}
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-xl font-semibold" style={{ color: "#1a1a18" }}>
            {formatValor(atual.valor)}{sufixo}
          </span>
          <span
            className="text-[11px] font-medium"
            style={{ color: varPositiva ? "#D85A30" : COR_PRIMARIA }}
          >
            {varPositiva ? "+" : ""}{variacao.toFixed(2)} vs 1a
          </span>
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={dados} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <XAxis
              dataKey="mes"
              tick={{ fontSize: 9, fill: "#ccc" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatarMes}
              interval={step}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "#ccc" }}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
              tickFormatter={(v: number) => v.toFixed(1)}
            />
            <Tooltip
              formatter={(value) => [formatValor(Number(value)) + sufixo, titulo]}
              labelFormatter={(label) => formatarMes(String(label))}
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #eee" }}
            />
            <Line
              type="monotone"
              dataKey="valor"
              stroke={cor}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ── Seção: Cenário Macroeconômico ───────────────────────────────────────────

export function CenarioMacro({
  selic,
  ipca,
  dolar,
  desemprego,
}: {
  selic: MacroSerie
  ipca: MacroSerie
  dolar: MacroSerie
  desemprego: MacroSerie
}) {
  // Selic: converter taxa diária → anualizada, agrupar mensal
  const selicMensal = agruparMensal(selic.dados).map((d) => ({
    ...d,
    valor: selicAnualizada(d.valor),
  }))

  // IPCA: já vem mensal, agrupar por acumulado 12 meses
  const ipcaMensal = agruparMensal(ipca.dados)
  const ipca12m = ipcaMensal.map((d, i) => {
    const janela = ipcaMensal.slice(Math.max(0, i - 11), i + 1)
    const acum = janela.reduce((acc, v) => acc * (1 + v.valor / 100), 1)
    return { mes: d.mes, valor: (acum - 1) * 100 }
  })

  const dolarMensal = agruparMensal(dolar.dados)
  const desempregoMensal = agruparMensal(desemprego.dados)

  return (
    <div className="grid grid-cols-4 gap-3">
      <MiniIndicador
        titulo="Selic % a.a."
        dados={selicMensal}
        cor={COR_PRIMARIA}
        formatValor={(v) => v.toFixed(2)}
        sufixo="%"
      />
      <MiniIndicador
        titulo="IPCA 12 meses"
        dados={ipca12m}
        cor={COR_LARANJA}
        formatValor={(v) => v.toFixed(2)}
        sufixo="%"
      />
      <MiniIndicador
        titulo="USD / BRL"
        dados={dolarMensal}
        cor={COR_SECUNDARIA}
        formatValor={(v) => `R$ ${v.toFixed(2)}`}
      />
      <MiniIndicador
        titulo="Desemprego %"
        dados={desempregoMensal}
        cor={COR_TERCIARIA}
        formatValor={(v) => v.toFixed(1)}
        sufixo="%"
      />
    </div>
  )
}

// ── Seção: Franchising vs Economia ──────────────────────────────────────────

export function FranchisingVsEconomia({
  fatAnual,
  pibTrimestral,
}: {
  fatAnual: FatAnualItem[]
  pibTrimestral: MacroSerie
}) {
  // Calcular crescimento % do faturamento ABF por ano (2015–2024)
  const totais = fatAnual
    .filter((r) => r.segmento === "Total")
    .sort((a, b) => a.periodo.localeCompare(b.periodo))

  // PIB trimestral: agrupar por ano (média dos trimestres)
  const pibPorAno = new Map<string, number[]>()
  for (const d of pibTrimestral.dados) {
    const ano = d.data.slice(0, 4)
    if (!pibPorAno.has(ano)) pibPorAno.set(ano, [])
    pibPorAno.get(ano)!.push(d.valor)
  }

  const serie: { ano: string; abf: number | null; pib: number | null }[] = []

  for (let i = 1; i < totais.length; i++) {
    const ano = totais[i].periodo.replace(/\D/g, "").slice(0, 4)
    const anoNum = parseInt(ano)
    if (anoNum < 2015 || anoNum > 2024) continue

    const crescAbf = ((totais[i].valor_mm / totais[i - 1].valor_mm) - 1) * 100

    // PIB: variação média anual
    const pibVals = pibPorAno.get(ano)
    const pibAnterior = pibPorAno.get(String(anoNum - 1))
    let crescPib: number | null = null
    if (pibVals && pibAnterior && pibVals.length > 0 && pibAnterior.length > 0) {
      const mediaAtual = pibVals.reduce((a, b) => a + b, 0) / pibVals.length
      const mediaAnt = pibAnterior.reduce((a, b) => a + b, 0) / pibAnterior.length
      crescPib = ((mediaAtual / mediaAnt) - 1) * 100
    }

    serie.push({
      ano,
      abf: +crescAbf.toFixed(1),
      pib: crescPib !== null ? +crescPib.toFixed(1) : null,
    })
  }

  return (
    <Card className="border-0 shadow-none" style={CARD_STYLE}>
      <CardContent className="p-6">
        <div className="text-[11px] uppercase tracking-[0.07em] font-medium mb-4" style={{ color: "#aaa" }}>
          Crescimento anual — Franchising ABF vs PIB Brasil (%)
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={serie} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0efe9" />
            <XAxis
              dataKey="ano"
              tick={{ fontSize: 11, fill: "#bbb" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#bbb" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              formatter={(value, name) => [
                `${Number(value).toFixed(1)}%`,
                name === "abf" ? "Franchising ABF" : "PIB Brasil",
              ]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #eee" }}
            />
            <Legend
              formatter={(value: string) => (value === "abf" ? "Franchising ABF" : "PIB Brasil")}
              wrapperStyle={{ fontSize: 11 }}
            />
            <Line
              type="monotone"
              dataKey="abf"
              stroke={COR_PRIMARIA}
              strokeWidth={2.5}
              dot={{ r: 4, fill: COR_PRIMARIA, stroke: "#fff", strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="pib"
              stroke={COR_SECUNDARIA}
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={{ r: 3, fill: COR_SECUNDARIA, stroke: "#fff", strokeWidth: 2 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="text-[11px] mt-3 text-center" style={{ color: "#aaa" }}>
          Franchising consistentemente acima do PIB — exceto em 2020 (COVID)
        </div>
      </CardContent>
    </Card>
  )
}

// ── Seção: PIB por Estado ───────────────────────────────────────────────────

export function PibPorEstado({ dados }: { dados: PibEstadoItem[] }) {
  // Pegar o ano mais recente e top 10
  const anosDisponiveis = [...new Set(dados.map((d) => d.data))].sort()
  const anoRecente = anosDisponiveis[anosDisponiveis.length - 1]

  const top10 = dados
    .filter((d) => d.data === anoRecente && d.valor > 0)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10)
    .map((d) => ({
      estado: d.localidade,
      valor_bi: d.valor / 1_000_000, // valor em R$ mil → R$ bi
      regiao: ESTADO_REGIAO[d.localidade] || "Outros",
    }))

  const maxValor = top10[0]?.valor_bi ?? 1

  // Regiões presentes no top 10
  const regioes = [...new Set(top10.map((d) => d.regiao))]

  return (
    <Card className="border-0 shadow-none" style={CARD_STYLE}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="text-[11px] uppercase tracking-[0.07em] font-medium" style={{ color: "#aaa" }}>
            PIB por estado — Top 10 ({anoRecente})
          </div>
          <div className="flex gap-3">
            {regioes.map((r) => (
              <span key={r} className="flex items-center gap-1" style={{ fontSize: 10, color: "#888" }}>
                <span
                  className="inline-block rounded-sm"
                  style={{ width: 8, height: 8, background: CORES_REGIAO[r] || "#999" }}
                />
                {r}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          {top10.map((d, i) => (
            <div key={d.estado} className="flex items-center gap-3">
              <span
                className="text-right shrink-0"
                style={{ fontSize: 11, color: i < 3 ? "#1a1a18" : "#888", fontWeight: i < 3 ? 500 : 400, width: 130 }}
              >
                {d.estado}
              </span>
              <div className="flex-1 rounded-full" style={{ height: 10, background: "#f0efe9" }}>
                <div
                  className="rounded-full"
                  style={{
                    height: "100%",
                    width: `${(d.valor_bi / maxValor) * 100}%`,
                    background: CORES_REGIAO[d.regiao] || "#999",
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
              <span
                className="shrink-0 font-medium"
                style={{ fontSize: 11, color: "#1a1a18", width: 75, textAlign: "right" }}
              >
                R$ {d.valor_bi.toFixed(0)} bi
              </span>
            </div>
          ))}
        </div>
        <div className="text-[10px] mt-3" style={{ color: "#ccc" }}>
          Fonte: IBGE — Contas Regionais
        </div>
      </CardContent>
    </Card>
  )
}
