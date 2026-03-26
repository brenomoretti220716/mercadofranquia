"use client"

import { useState, useMemo } from "react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
  LineChart, Line,
} from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

const CORES_SEGMENTO = [
  "#1D9E75", "#378ADD", "#534AB7", "#D85A30",
  "#BA7517", "#D4537E", "#639922", "#0F6E56",
]

const COR_CRESCIMENTO = "#5DCAA5"
const COR_ULTIMO_ANO = "#1D9E75"
const COR_COVID = "#E24B4A"

function corBarra(periodo: string) {
  if (periodo === "2020") return COR_COVID
  if (periodo === "2024") return COR_ULTIMO_ANO
  return COR_CRESCIMENTO
}

const PERIODOS_FILTRO = [
  { label: "Todos", value: "todos" },
  { label: "2020-2024", value: "2020-2024" },
  { label: "2022-2025", value: "2022-2025" },
] as const

const ANOS_RANKING = [2023, 2022, 2020, 2018] as const

interface KPI {
  label: string
  valor: string
  sub: string
  cor: string
}

interface RankingItem {
  posicao: number
  marca: string
  segmento: string
  unidades: number
  variacao?: number
}

interface DashboardProps {
  kpis: KPI[]
  serieAnual: { periodo: string; valor_bi: number }[]
  segmentos: { segmento: string; valor_mm: number }[]
  segmentosAnual: { segmento: string; periodo: string; valor_mm: number }[]
  projecoes: {
    ano_referencia: number
    fat_var_min_pct: number
    fat_var_max_pct: number
    fat_realizado_pct: number
  }[]
  ranking: RankingItem[]
  serieEmpregos: { ano: string; empregos: number; empregos_mi: number }[]
  indicadores: any[]
}

function badgeProjecao(p: DashboardProps["projecoes"][0]) {
  const superou = p.fat_realizado_pct > p.fat_var_max_pct
  const noAlvo = !superou && p.fat_realizado_pct >= p.fat_var_min_pct
  if (superou) return { label: "Superou", bg: "#E1F5EE", color: "#0F6E56" }
  if (noAlvo) return { label: "No alvo", bg: "#E6F1FB", color: "#185FA5" }
  return { label: "Abaixo", bg: "#FCEBEB", color: "#A32D2D" }
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mt-10 mb-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: "#1a1a18" }}>
        {children}
      </h2>
      <div className="flex-1 h-px" style={{ background: "#e0dfda" }} />
    </div>
  )
}

function corSegmentoByName(segmento: string, allSegmentos: string[]): string {
  const idx = allSegmentos.indexOf(segmento)
  return CORES_SEGMENTO[idx >= 0 ? idx % CORES_SEGMENTO.length : 0]
}

export default function Dashboard({
  kpis, serieAnual, segmentos, segmentosAnual, projecoes, ranking, serieEmpregos, indicadores,
}: DashboardProps) {
  const [periodo, setPeriodo] = useState<string>("todos")
  const [anoRanking, setAnoRanking] = useState<number>(2023)

  const maxSeg = segmentos[0]?.valor_mm ?? 1

  const serieAnualFiltrada = useMemo(() => {
    if (periodo === "todos") return serieAnual
    const [min, max] = periodo.split("-").map(Number)
    return serieAnual.filter((r) => {
      const ano = parseInt(r.periodo)
      return ano >= min && ano <= max
    })
  }, [serieAnual, periodo])

  const allSegNames = useMemo(
    () => segmentos.map((s) => s.segmento),
    [segmentos],
  )

  const crescimentoSegmentos = useMemo(() => {
    const getVal = (seg: string, periodoKey: string) => {
      const found = segmentosAnual.find(
        (r) => r.segmento === seg && r.periodo === periodoKey,
      )
      return found?.valor_mm ?? 0
    }

    return segmentos
      .map((s) => {
        const v2022 = getVal(s.segmento, "4T2022") || getVal(s.segmento, "2022")
        const v2025 = getVal(s.segmento, "4T2024") || getVal(s.segmento, "2024") || getVal(s.segmento, "4T2023")
        const crescimento = v2022 > 0 ? ((v2025 / v2022 - 1) * 100) : 0
        return { segmento: s.segmento, crescimento: +crescimento.toFixed(1) }
      })
      .filter((s) => s.crescimento !== 0)
      .sort((a, b) => b.crescimento - a.crescimento)
  }, [segmentos, segmentosAnual])

  const maxCrescimento = useMemo(
    () => Math.max(...crescimentoSegmentos.map((s) => Math.abs(s.crescimento)), 1),
    [crescimentoSegmentos],
  )

  const rankingFiltrado = useMemo(() => {
    const filtered = ranking.filter((r: any) => !r.ano || r.ano === anoRanking)
    return filtered.slice(0, 50)
  }, [ranking, anoRanking])

  const projecoesFiltradas = useMemo(() => {
    if (periodo === "todos") return projecoes
    const [min, max] = periodo.split("-").map(Number)
    return projecoes.filter((p) => p.ano_referencia >= min && p.ano_referencia <= max)
  }, [projecoes, periodo])

  const maxProjecaoRealizado = useMemo(
    () => Math.max(...projecoesFiltradas.map((p) => p.fat_realizado_pct), 1),
    [projecoesFiltradas],
  )

  return (
    <>
      {/* Filtro de periodo */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs uppercase tracking-wider font-medium" style={{ color: "#aaa" }}>
          Periodo:
        </span>
        <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "#eae9e4" }}>
          {PERIODOS_FILTRO.map((f) => (
            <button
              key={f.value}
              onClick={() => setPeriodo(f.value)}
              className="px-3 py-1 rounded-md text-xs font-medium transition-all"
              style={{
                background: periodo === f.value ? "#fff" : "transparent",
                color: periodo === f.value ? "#1a1a18" : "#888",
                boxShadow: periodo === f.value ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {kpis.map((k, i) => (
          <Card
            key={i}
            className="border-0 shadow-none"
            style={{
              background: "#fff",
              border: "0.5px solid rgba(0,0,0,0.08)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <CardContent className="p-4">
              <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "#aaa" }}>
                {k.label}
              </div>
              <div className="text-2xl font-medium" style={{ color: "#1a1a18" }}>
                {k.valor}
              </div>
              <div className="text-xs mt-1" style={{ color: k.cor }}>
                {k.sub}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SECAO: Faturamento */}
      <SectionTitle>Faturamento</SectionTitle>

      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        {/* Bar chart - serie historica */}
        <Card
          className="border-0 shadow-none"
          style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <CardContent className="p-6">
            <div className="text-[11px] uppercase tracking-[0.07em] font-medium mb-4" style={{ color: "#aaa" }}>
              Faturamento anual — R$ bilhoes
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={serieAnualFiltrada} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0efe9" />
                <XAxis dataKey="periodo" tick={{ fontSize: 10, fill: "#bbb" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#bbb" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}`} />
                <Tooltip
                  formatter={(value) => [`R$ ${value} bi`, "Faturamento"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #eee" }}
                />
                <Bar dataKey="valor_bi" radius={[3, 3, 0, 0]} maxBarSize={36}>
                  {serieAnualFiltrada.map((entry) => (
                    <Cell key={entry.periodo} fill={corBarra(entry.periodo)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-3" style={{ fontSize: 11, color: "#888" }}>
              {[
                { cor: COR_CRESCIMENTO, label: "Crescimento" },
                { cor: COR_ULTIMO_ANO, label: "Ultimo ano" },
                { cor: COR_COVID, label: "COVID" },
              ].map((item) => (
                <span key={item.label} className="flex items-center gap-1">
                  <span className="inline-block rounded-sm" style={{ width: 10, height: 10, background: item.cor }} />
                  {item.label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Horizontal bars - segmentos */}
        <Card
          className="border-0 shadow-none"
          style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <CardContent className="p-6">
            <div className="text-[11px] uppercase tracking-[0.07em] font-medium mb-4" style={{ color: "#aaa" }}>
              Top segmentos 2023
            </div>
            <div className="flex flex-col gap-3">
              {segmentos.slice(0, 8).map((r, i) => (
                <div key={r.segmento}>
                  <div className="flex justify-between mb-1">
                    <span style={{ fontSize: 11, color: "#555" }}>{r.segmento}</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: "#1a1a18" }}>
                      R$ {(r.valor_mm / 1000).toFixed(1)} bi
                    </span>
                  </div>
                  <div className="rounded-full" style={{ height: 6, background: "#f0efe9" }}>
                    <div
                      className="rounded-full"
                      style={{
                        height: "100%",
                        background: CORES_SEGMENTO[i],
                        width: `${(r.valor_mm / maxSeg) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECAO: Empregos Diretos */}
      <SectionTitle>Empregos Diretos</SectionTitle>

      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <Card
          className="border-0 shadow-none"
          style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <CardContent className="p-6">
            <div className="text-[11px] uppercase tracking-[0.07em] font-medium mb-4" style={{ color: "#aaa" }}>
              Evolucao de empregos diretos — milhoes
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={serieEmpregos} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0efe9" />
                <XAxis dataKey="ano" tick={{ fontSize: 10, fill: "#bbb" }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: "#bbb" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v.toFixed(1)}`}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toFixed(2)} mi`, "Empregos"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #eee" }}
                />
                <Line
                  type="monotone"
                  dataKey="empregos_mi"
                  stroke={COR_ULTIMO_ANO}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: COR_ULTIMO_ANO, stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card
          className="border-0 shadow-none flex flex-col justify-center"
          style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="text-[11px] uppercase tracking-wider mb-3" style={{ color: "#aaa" }}>
              Empregos por unidade
            </div>
            <div className="text-5xl font-semibold mb-1" style={{ color: COR_ULTIMO_ANO }}>
              ~{kpis[2] ? Math.round(
                (() => {
                  const last = indicadores
                    .filter((r: any) => r.empregos_diretos && r.unidades)
                    .sort((a: any, b: any) => a.ano - b.ano)
                    .pop()
                  return last ? last.empregos_diretos / last.unidades : 9
                })()
              ) : 9}
            </div>
            <div className="text-xs mt-1" style={{ color: "#888" }}>
              media do setor
            </div>
            {serieEmpregos.length > 1 && (
              <div className="text-xs mt-4 px-3 py-1 rounded-full" style={{ background: "#E1F5EE", color: "#0F6E56" }}>
                {serieEmpregos[serieEmpregos.length - 1]?.empregos_mi} mi em {serieEmpregos[serieEmpregos.length - 1]?.ano}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SECAO: Projecoes vs Realizado */}
      <SectionTitle>Projecoes vs Realizado</SectionTitle>

      <Card
        className="border-0 shadow-none mb-4"
        style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
      >
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#eee] hover:bg-transparent">
                <TableHead className="text-[11px] uppercase text-[#bbb] font-medium">Ano</TableHead>
                <TableHead className="text-[11px] uppercase text-[#bbb] font-medium text-right">Projecao ABF</TableHead>
                <TableHead className="text-[11px] uppercase text-[#bbb] font-medium text-right">Realizado</TableHead>
                <TableHead className="text-[11px] uppercase text-[#bbb] font-medium" style={{ width: "30%" }}>
                  Comparacao
                </TableHead>
                <TableHead className="text-[11px] uppercase text-[#bbb] font-medium text-right">Resultado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projecoesFiltradas.map((p) => {
                const badge = badgeProjecao(p)
                const superou = p.fat_realizado_pct > p.fat_var_max_pct
                const projecaoText =
                  p.fat_var_min_pct === p.fat_var_max_pct
                    ? `+${p.fat_var_min_pct}%`
                    : `+${p.fat_var_min_pct}% a +${p.fat_var_max_pct}%`

                const barWidthProj = (p.fat_var_max_pct / maxProjecaoRealizado) * 100
                const barWidthReal = (p.fat_realizado_pct / maxProjecaoRealizado) * 100

                return (
                  <TableRow key={p.ano_referencia} className="border-b border-[#f5f5f2] hover:bg-transparent">
                    <TableCell className="font-medium" style={{ color: "#1a1a18" }}>
                      {p.ano_referencia}
                    </TableCell>
                    <TableCell className="text-right" style={{ color: "#999" }}>
                      {projecaoText}
                    </TableCell>
                    <TableCell
                      className="text-right font-medium"
                      style={{ color: superou ? COR_ULTIMO_ANO : "#1a1a18" }}
                    >
                      +{p.fat_realizado_pct}%
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 9, color: "#bbb", width: 20 }}>ABF</span>
                          <div className="flex-1 rounded-full" style={{ height: 5, background: "#f0efe9" }}>
                            <div
                              className="rounded-full"
                              style={{ height: "100%", width: `${barWidthProj}%`, background: "#378ADD", opacity: 0.5 }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 9, color: "#bbb", width: 20 }}>Real</span>
                          <div className="flex-1 rounded-full" style={{ height: 5, background: "#f0efe9" }}>
                            <div
                              className="rounded-full"
                              style={{ height: "100%", width: `${barWidthReal}%`, background: badge.color }}
                            />
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className="inline-block text-[11px] font-medium rounded-full px-3 py-0.5"
                        style={{ background: badge.bg, color: badge.color }}
                      >
                        {badge.label}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* SECAO: Crescimento por Segmento */}
      {crescimentoSegmentos.length > 0 && (
        <>
          <SectionTitle>Crescimento por Segmento</SectionTitle>

          <Card
            className="border-0 shadow-none mb-4"
            style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <CardContent className="p-6">
              <div className="text-[11px] uppercase tracking-[0.07em] font-medium mb-5" style={{ color: "#aaa" }}>
                Variacao % do faturamento — periodo recente
              </div>
              <div className="flex flex-col gap-3">
                {crescimentoSegmentos.map((s, i) => (
                  <div key={s.segmento} className="flex items-center gap-3">
                    <span
                      className="text-right shrink-0 truncate"
                      style={{ fontSize: 11, color: "#555", width: 160 }}
                    >
                      {s.segmento}
                    </span>
                    <div className="flex-1 rounded-full" style={{ height: 8, background: "#f0efe9" }}>
                      <div
                        className="rounded-full"
                        style={{
                          height: "100%",
                          width: `${Math.max((Math.abs(s.crescimento) / maxCrescimento) * 100, 2)}%`,
                          background: s.crescimento >= 0
                            ? corSegmentoByName(s.segmento, allSegNames)
                            : COR_COVID,
                        }}
                      />
                    </div>
                    <span
                      className="shrink-0 font-medium"
                      style={{
                        fontSize: 12,
                        color: s.crescimento >= 0 ? COR_ULTIMO_ANO : COR_COVID,
                        width: 52,
                        textAlign: "right",
                      }}
                    >
                      {s.crescimento >= 0 ? "+" : ""}{s.crescimento}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* SECAO: Ranking 50 Maiores */}
      <SectionTitle>Ranking das 50 Maiores</SectionTitle>

      <Card
        className="border-0 shadow-none"
        style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] uppercase tracking-[0.07em] font-medium" style={{ color: "#aaa" }}>
              Maiores redes por numero de unidades
            </div>
            <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "#eae9e4" }}>
              {ANOS_RANKING.map((a) => (
                <button
                  key={a}
                  onClick={() => setAnoRanking(a)}
                  className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                  style={{
                    background: anoRanking === a ? "#fff" : "transparent",
                    color: anoRanking === a ? "#1a1a18" : "#888",
                    boxShadow: anoRanking === a ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div style={{ maxHeight: 600, overflowY: "auto" }}>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#eee] hover:bg-transparent">
                  <TableHead className="text-[11px] uppercase text-[#bbb] font-medium w-12">#</TableHead>
                  <TableHead className="text-[11px] uppercase text-[#bbb] font-medium w-12">Var</TableHead>
                  <TableHead className="text-[11px] uppercase text-[#bbb] font-medium">Marca</TableHead>
                  <TableHead className="text-[11px] uppercase text-[#bbb] font-medium">Segmento</TableHead>
                  <TableHead className="text-[11px] uppercase text-[#bbb] font-medium text-right">Unidades</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankingFiltrado.map((r, idx) => {
                  const segIdx = allSegNames.indexOf(r.segmento)
                  const segColor = CORES_SEGMENTO[segIdx >= 0 ? segIdx % CORES_SEGMENTO.length : 0]
                  const variacao = r.variacao ?? 0

                  return (
                    <TableRow key={`${r.marca}-${idx}`} className="border-b border-[#f5f5f2] hover:bg-transparent">
                      <TableCell className="font-medium" style={{ color: "#1a1a18" }}>
                        {r.posicao ?? idx + 1}
                      </TableCell>
                      <TableCell>
                        {variacao > 0 && (
                          <span style={{ color: COR_ULTIMO_ANO, fontSize: 12 }}>&#9650; {variacao}</span>
                        )}
                        {variacao < 0 && (
                          <span style={{ color: COR_COVID, fontSize: 12 }}>&#9660; {Math.abs(variacao)}</span>
                        )}
                        {variacao === 0 && (
                          <span style={{ color: "#ccc", fontSize: 12 }}>—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium" style={{ color: "#1a1a18" }}>
                        {r.marca}
                      </TableCell>
                      <TableCell>
                        <span
                          className="inline-block text-[10px] font-medium rounded-full px-2.5 py-0.5"
                          style={{
                            background: `${segColor}15`,
                            color: segColor,
                          }}
                        >
                          {r.segmento}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium" style={{ color: "#1a1a18" }}>
                        {r.unidades?.toLocaleString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {rankingFiltrado.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8" style={{ color: "#bbb" }}>
                      Nenhum dado disponivel para {anoRanking}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
