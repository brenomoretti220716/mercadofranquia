"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InsightBox, h, GraficoRodape } from "@/components/insight-box"

const CARD = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }
const COR_PRIMARIA = "#E8421A"
const COR_COVID = "#D32F2F"
const ANOS = [2023, 2022, 2020, 2018] as const

interface Props {
  ranking: any[]
  segmentos: any[]
}

export function TabRanking({ ranking, segmentos }: Props) {
  const [anoAtivo, setAnoAtivo] = useState<number>(2023)
  const [segFiltro, setSegFiltro] = useState<string | null>(null)

  const segmentosUnicos = useMemo(() => [...new Set(ranking.map((r: any) => r.segmento).filter(Boolean))].sort(), [ranking])

  const rankingFiltrado = useMemo(() => {
    let filtered = ranking.filter((r: any) => !r.ano || r.ano === anoAtivo)
    if (segFiltro) filtered = filtered.filter((r: any) => r.segmento === segFiltro)
    return filtered.slice(0, 50)
  }, [ranking, anoAtivo, segFiltro])

  // ── Insights ──────────────────────────────────────────────────────
  const rankingInsights = useMemo(() => {
    if (rankingFiltrado.length === 0) return []
    const lider = rankingFiltrado[0]
    const segundo = rankingFiltrado[1]
    const insights: string[] = []

    if (lider) {
      const liderVantagem = segundo ? Math.round(((lider.unidades / segundo.unidades) - 1) * 100) : 0
      insights.push(`${h(lider.marca)} lidera com ${h(lider.unidades?.toLocaleString("pt-BR"))} unidades${segundo ? ` — ${h(liderVantagem + "%")} mais que ${segundo.marca}` : ""}`)
    }

    const top10Unidades = rankingFiltrado.slice(0, 10).reduce((acc: number, r: any) => acc + (r.unidades || 0), 0)
    const totalUnidades = rankingFiltrado.reduce((acc: number, r: any) => acc + (r.unidades || 0), 0)
    if (totalUnidades > 0) {
      insights.push(`Top 10 marcas concentram ${h(Math.round((top10Unidades / totalUnidades) * 100) + "%")} de todas as unidades do ranking`)
    }

    const maiorCrescimento = rankingFiltrado.filter((r: any) => r.var_pct > 0).sort((a: any, b: any) => b.var_pct - a.var_pct)[0]
    if (maiorCrescimento) {
      insights.push(`Maior crescimento: ${h(maiorCrescimento.marca)} ${h("+" + maiorCrescimento.var_pct?.toFixed(1) + "%")} vs ano anterior`)
    }

    return insights
  }, [rankingFiltrado])

  return (
    <>
      {rankingInsights.length > 0 && <InsightBox insights={rankingInsights} />}
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4 mb-5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#999" }}>Ano:</span>
          <div className="flex gap-1 p-0.5" style={{ background: "#F0F0F0", borderRadius: 8 }}>
            {ANOS.map((a) => (
              <button key={a} onClick={() => setAnoAtivo(a)} className="px-3 py-1 text-xs font-semibold transition-all"
                style={{ background: anoAtivo === a ? "#fff" : "transparent", color: anoAtivo === a ? "#1A1A1A" : "#999", borderRadius: 6, boxShadow: anoAtivo === a ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                {a}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#999" }}>Segmento:</span>
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setSegFiltro(null)} className="px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all"
              style={{ background: !segFiltro ? COR_PRIMARIA : "#F0F0F0", color: !segFiltro ? "#fff" : "#999" }}>Todos</button>
            {segmentosUnicos.map((s) => (
              <button key={s} onClick={() => setSegFiltro(segFiltro === s ? null : s)} className="px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all"
                style={{ background: segFiltro === s ? COR_PRIMARIA : "#F0F0F0", color: segFiltro === s ? "#fff" : "#999" }}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6" style={CARD}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#999" }}>Maiores redes por numero de unidades — {anoAtivo}</div>
          <span style={{ fontSize: 10, color: "#BBB" }}>Fonte: ABF + Mercado Franquia</span>
        </div>
        <div style={{ maxHeight: 600, overflowY: "auto" }}>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#E5E5E5] hover:bg-transparent">
                <TableHead className="text-[11px] uppercase text-[#BBB] font-semibold w-12">#</TableHead>
                <TableHead className="text-[11px] uppercase text-[#BBB] font-semibold w-12">Var</TableHead>
                <TableHead className="text-[11px] uppercase text-[#BBB] font-semibold">Marca</TableHead>
                <TableHead className="text-[11px] uppercase text-[#BBB] font-semibold">Segmento</TableHead>
                <TableHead className="text-[11px] uppercase text-[#BBB] font-semibold text-right">Unidades</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankingFiltrado.map((r: any, idx: number) => {
                const variacao = r.variacao ?? r.var_pct ?? 0
                const pos = r.posicao ?? idx + 1
                return (
                  <TableRow key={`${r.marca}-${idx}`} className="border-b border-[#F5F5F5] hover:bg-transparent">
                    <TableCell>
                      <span className="inline-flex items-center justify-center font-bold text-white text-[10px]" style={{ width: 24, height: 24, borderRadius: "50%", background: pos <= 3 ? COR_PRIMARIA : "#DDD", color: pos <= 3 ? "#fff" : "#888" }}>
                        {pos}
                      </span>
                    </TableCell>
                    <TableCell>
                      {variacao > 0 && <span style={{ color: "#4CAF50", fontSize: 12 }}>{"\u25B2"} {typeof variacao === "number" ? variacao.toFixed(1) : variacao}</span>}
                      {variacao < 0 && <span style={{ color: COR_COVID, fontSize: 12 }}>{"\u25BC"} {Math.abs(variacao).toFixed(1)}</span>}
                      {variacao === 0 && <span style={{ color: "#DDD", fontSize: 12 }}>—</span>}
                    </TableCell>
                    <TableCell className="font-semibold" style={{ color: "#1A1A1A" }}>{r.marca}</TableCell>
                    <TableCell>
                      <span className="inline-block text-[10px] font-semibold rounded-full px-2.5 py-0.5" style={{ background: "#FFF0ED", color: COR_PRIMARIA }}>{r.segmento}</span>
                    </TableCell>
                    <TableCell className="text-right font-semibold" style={{ color: "#1A1A1A" }}>{r.unidades?.toLocaleString("pt-BR")}</TableCell>
                  </TableRow>
                )
              })}
              {rankingFiltrado.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8" style={{ color: "#BBB" }}>Nenhum dado disponivel</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <GraficoRodape fonte="ABF + Mercado Franquia" periodo={String(anoAtivo)} />
      </div>
    </>
  )
}
