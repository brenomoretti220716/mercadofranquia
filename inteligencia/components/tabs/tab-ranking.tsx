"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const CARD_STYLE = { background: "#fff", border: "0.5px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }
const CORES = ["#1D9E75", "#378ADD", "#534AB7", "#D85A30", "#BA7517", "#D4537E", "#639922", "#0F6E56"]
const COR_PRIMARIA = "#1D9E75"
const COR_COVID = "#E24B4A"
const ANOS = [2023, 2022, 2020, 2018] as const

interface Props {
  ranking: any[]
  segmentos: any[]
}

export function TabRanking({ ranking, segmentos }: Props) {
  const [anoAtivo, setAnoAtivo] = useState<number>(2023)
  const [segFiltro, setSegFiltro] = useState<string | null>(null)

  const allSegNames = useMemo(() => segmentos.map((s: any) => s.segmento), [segmentos])
  const segmentosUnicos = useMemo(() => [...new Set(ranking.map((r: any) => r.segmento).filter(Boolean))].sort(), [ranking])

  const rankingFiltrado = useMemo(() => {
    let filtered = ranking.filter((r: any) => !r.ano || r.ano === anoAtivo)
    if (segFiltro) filtered = filtered.filter((r: any) => r.segmento === segFiltro)
    return filtered.slice(0, 50)
  }, [ranking, anoAtivo, segFiltro])

  return (
    <>
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4 mb-5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "#aaa" }}>Ano:</span>
          <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "#eae9e4" }}>
            {ANOS.map((a) => (
              <button key={a} onClick={() => setAnoAtivo(a)} className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                style={{ background: anoAtivo === a ? "#fff" : "transparent", color: anoAtivo === a ? "#1a1a18" : "#888", boxShadow: anoAtivo === a ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                {a}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "#aaa" }}>Segmento:</span>
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setSegFiltro(null)} className="px-2.5 py-1 rounded-full text-[10px] font-medium transition-all"
              style={{ background: !segFiltro ? COR_PRIMARIA : "#eae9e4", color: !segFiltro ? "#fff" : "#888" }}>Todos</button>
            {segmentosUnicos.map((s) => (
              <button key={s} onClick={() => setSegFiltro(segFiltro === s ? null : s)} className="px-2.5 py-1 rounded-full text-[10px] font-medium transition-all"
                style={{ background: segFiltro === s ? COR_PRIMARIA : "#eae9e4", color: segFiltro === s ? "#fff" : "#888" }}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      <Card className="border-0 shadow-none" style={CARD_STYLE}>
        <CardContent className="p-6">
          <div className="text-[11px] uppercase tracking-[0.07em] font-medium mb-4" style={{ color: "#aaa" }}>
            Maiores redes por numero de unidades — {anoAtivo}
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
                {rankingFiltrado.map((r: any, idx: number) => {
                  const segIdx = allSegNames.indexOf(r.segmento)
                  const segColor = CORES[segIdx >= 0 ? segIdx % CORES.length : 0]
                  const variacao = r.variacao ?? r.var_pct ?? 0
                  return (
                    <TableRow key={`${r.marca}-${idx}`} className="border-b border-[#f5f5f2] hover:bg-transparent">
                      <TableCell className="font-medium" style={{ color: "#1a1a18" }}>{r.posicao ?? idx + 1}</TableCell>
                      <TableCell>
                        {variacao > 0 && <span style={{ color: COR_PRIMARIA, fontSize: 12 }}>{"\u25B2"} {typeof variacao === "number" ? variacao.toFixed(1) : variacao}</span>}
                        {variacao < 0 && <span style={{ color: COR_COVID, fontSize: 12 }}>{"\u25BC"} {Math.abs(variacao).toFixed(1)}</span>}
                        {variacao === 0 && <span style={{ color: "#ccc", fontSize: 12 }}>—</span>}
                      </TableCell>
                      <TableCell className="font-medium" style={{ color: "#1a1a18" }}>{r.marca}</TableCell>
                      <TableCell>
                        <span className="inline-block text-[10px] font-medium rounded-full px-2.5 py-0.5" style={{ background: `${segColor}15`, color: segColor }}>{r.segmento}</span>
                      </TableCell>
                      <TableCell className="text-right font-medium" style={{ color: "#1a1a18" }}>{r.unidades?.toLocaleString("pt-BR")}</TableCell>
                    </TableRow>
                  )
                })}
                {rankingFiltrado.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-8" style={{ color: "#bbb" }}>Nenhum dado disponivel</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
