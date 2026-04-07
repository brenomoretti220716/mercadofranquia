"use client"

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Legend,
} from "recharts"
import { Card, CardContent } from "@/components/ui/card"

// ── Constantes ──────────────────────────────────────────────────────────────

const COR_ABF = "#E8421A"
const COR_VAREJO = "#2563EB"
const COR_COMERCIO = "#534AB7"
const COR_SERVICOS = "#F4845F"

const CARD_STYLE = {
  background: "#fff",
  border: "0.5px solid rgba(0,0,0,0.08)",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
}

// ── Tipos ───────────────────────────────────────────────────────────────────

interface PMCItem {
  data: string
  codigo_segmento: string
  nome_segmento: string
  variacao_mensal: number | null
  variacao_anual: number | null
}

interface CagedItem {
  data: string
  setor: string
  estoque: number
  saldo: number | null
}

interface FatSegItem {
  periodo: string
  segmento: string
  valor_mm: number
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatMes(data: string): string {
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  const [ano, mes] = data.split("-")
  return `${meses[parseInt(mes) - 1]}/${ano.slice(2)}`
}

function calcCrescimentoAbf(segmentos: FatSegItem[], nomes: string[]): number | null {
  const filtered = segmentos.filter((s) => nomes.some((n) => s.segmento.includes(n)))
  if (filtered.length < 2) return null

  const porPeriodo = new Map<string, number>()
  for (const s of filtered) {
    const ano = s.periodo.replace(/\D/g, "").slice(0, 4)
    porPeriodo.set(ano, (porPeriodo.get(ano) || 0) + s.valor_mm)
  }

  const anos = [...porPeriodo.keys()].sort()
  if (anos.length < 2) return null

  const ultimo = porPeriodo.get(anos[anos.length - 1])!
  const penultimo = porPeriodo.get(anos[anos.length - 2])!
  return +((ultimo / penultimo - 1) * 100).toFixed(1)
}

// ── Mini gráfico comparativo ────────────────────────────────────────────────

function MiniComparativo({
  titulo,
  dadosPMC,
  crescAbf,
}: {
  titulo: string
  dadosPMC: { mes: string; pmc: number }[]
  crescAbf: number | null
}) {
  const ultimoPMC = dadosPMC[dadosPMC.length - 1]?.pmc ?? 0
  const diff = crescAbf !== null ? +(crescAbf - ultimoPMC).toFixed(1) : null
  const step = Math.max(1, Math.floor(dadosPMC.length / 5))

  return (
    <Card className="border-0 shadow-none" style={CARD_STYLE}>
      <CardContent className="p-4">
        <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#aaa" }}>
          {titulo}
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          {crescAbf !== null && (
            <span className="text-xs font-medium" style={{ color: COR_ABF }}>
              ABF {crescAbf > 0 ? "+" : ""}{crescAbf}%
            </span>
          )}
          <span className="text-xs" style={{ color: COR_VAREJO }}>
            Varejo {ultimoPMC > 0 ? "+" : ""}{ultimoPMC.toFixed(1)}%
          </span>
        </div>
        {diff !== null && diff > 0 && (
          <div
            className="inline-block text-[10px] font-medium rounded-full px-2 py-0.5 mb-2"
            style={{ background: "#FFF0ED", color: "#E8421A" }}
          >
            Franquias +{diff}pp acima
          </div>
        )}
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={dadosPMC} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
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
            />
            <Tooltip
              formatter={(value) => [`${Number(value).toFixed(1)}%`, "Varejo PMC"]}
              labelFormatter={(label) => formatMes(String(label))}
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #eee" }}
            />
            <Line
              type="monotone"
              dataKey="pmc"
              stroke={COR_VAREJO}
              strokeWidth={1.5}
              strokeDasharray="6 3"
              dot={false}
              activeDot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ── Seção: Franchising vs Varejo Geral ──────────────────────────────────────

const COMPARATIVOS = [
  {
    titulo: "Saude/Beleza vs Farma/Cosmeticos",
    codigoPMC: "103155",
    segmentosABF: ["Saúde, Beleza"],
  },
  {
    titulo: "Moda vs Tecidos/Vestuario",
    codigoPMC: "90673",
    segmentosABF: ["Moda"],
  },
  {
    titulo: "Alimentacao vs Hiper/Supermercados",
    codigoPMC: "90672",
    segmentosABF: ["Alimentação"],
  },
  {
    titulo: "Casa/Construcao vs Moveis/Eletro",
    codigoPMC: "2759",
    segmentosABF: ["Casa e Construção"],
  },
]

export function FranchisingVsVarejo({
  pmcDados,
  segmentosABF,
}: {
  pmcDados: PMCItem[]
  segmentosABF: FatSegItem[]
}) {
  const cards = COMPARATIVOS.map((comp) => {
    // PMC: filtrar segmento e pegar variação YoY mensal
    const pmcFiltrado = pmcDados
      .filter((d) => d.codigo_segmento === comp.codigoPMC && d.variacao_mensal !== null)
      .sort((a, b) => a.data.localeCompare(b.data))
      .map((d) => ({ mes: d.data, pmc: d.variacao_mensal! }))

    // ABF: crescimento anual do segmento
    const crescAbf = calcCrescimentoAbf(segmentosABF, comp.segmentosABF)

    return (
      <MiniComparativo
        key={comp.codigoPMC}
        titulo={comp.titulo}
        dadosPMC={pmcFiltrado}
        crescAbf={crescAbf}
      />
    )
  })

  return <div className="grid grid-cols-4 gap-3">{cards}</div>
}

// ── Seção: Emprego Formal ───────────────────────────────────────────────────

export function EmpregoFormal({
  cagedComercio,
  cagedServicos,
  empregosAbf,
}: {
  cagedComercio: CagedItem[]
  cagedServicos: CagedItem[]
  empregosAbf: number | null
}) {
  // Unir saldos de comércio e serviços por mês
  const saldoMap = new Map<string, { mes: string; comercio: number; servicos: number }>()

  for (const d of cagedComercio) {
    if (d.saldo === null) continue
    const mes = d.data.slice(0, 7)
    if (!saldoMap.has(mes)) saldoMap.set(mes, { mes, comercio: 0, servicos: 0 })
    saldoMap.get(mes)!.comercio = d.saldo
  }
  for (const d of cagedServicos) {
    if (d.saldo === null) continue
    const mes = d.data.slice(0, 7)
    if (!saldoMap.has(mes)) saldoMap.set(mes, { mes, comercio: 0, servicos: 0 })
    saldoMap.get(mes)!.servicos = d.saldo
  }

  const serieSaldo = [...saldoMap.values()]
    .sort((a, b) => a.mes.localeCompare(b.mes))
    .slice(-24) // últimos 24 meses

  // Estoque mais recente de comércio + serviços
  const estoqueComercio = cagedComercio.length > 0
    ? cagedComercio.sort((a, b) => b.data.localeCompare(a.data))[0].estoque
    : 0
  const estoqueServicos = cagedServicos.length > 0
    ? cagedServicos.sort((a, b) => b.data.localeCompare(a.data))[0].estoque
    : 0
  const estoqueTotal = estoqueComercio + estoqueServicos

  const percentFranchising = empregosAbf && estoqueTotal > 0
    ? +((empregosAbf / estoqueTotal) * 100).toFixed(1)
    : null

  const step = Math.max(1, Math.floor(serieSaldo.length / 8))

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "2fr 1fr" }}>
      <Card className="border-0 shadow-none" style={CARD_STYLE}>
        <CardContent className="p-6">
          <div className="text-[11px] uppercase tracking-[0.07em] font-medium mb-4" style={{ color: "#aaa" }}>
            Saldo CAGED mensal — Comercio + Servicos (mil vagas)
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={serieSaldo} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0efe9" />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 9, fill: "#bbb" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatMes}
                interval={step}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#bbb" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value, name) => [
                  `${Number(value).toLocaleString("pt-BR")} vagas`,
                  name === "comercio" ? "Comércio" : "Serviços",
                ]}
                labelFormatter={(label) => formatMes(String(label))}
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #eee" }}
              />
              <Legend
                formatter={(value) => (value === "comercio" ? "Comércio" : "Serviços")}
                wrapperStyle={{ fontSize: 11 }}
              />
              <Bar dataKey="comercio" fill={COR_COMERCIO} radius={[2, 2, 0, 0]} maxBarSize={14} />
              <Bar dataKey="servicos" fill={COR_SERVICOS} radius={[2, 2, 0, 0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-none flex flex-col justify-center" style={CARD_STYLE}>
        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
          <div className="text-[11px] uppercase tracking-wider mb-3" style={{ color: "#aaa" }}>
            Franchising no emprego formal
          </div>
          {percentFranchising !== null ? (
            <>
              <div className="text-4xl font-semibold mb-1" style={{ color: COR_ABF }}>
                {percentFranchising}%
              </div>
              <div className="text-xs mt-1" style={{ color: "#888" }}>
                do emprego em comercio + servicos
              </div>
              <div className="text-xs mt-4 px-3 py-1 rounded-full" style={{ background: "#FFF0ED", color: "#E8421A" }}>
                {empregosAbf ? `${(empregosAbf / 1_000_000).toFixed(2)} mi empregos diretos` : ""}
              </div>
              <div className="text-[10px] mt-2" style={{ color: "#bbb" }}>
                vs {(estoqueTotal / 1_000_000).toFixed(1)} mi CAGED (comercio+servicos)
              </div>
            </>
          ) : (
            <div className="text-sm" style={{ color: "#bbb" }}>Dados insuficientes</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
