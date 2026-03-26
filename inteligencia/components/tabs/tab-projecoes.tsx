"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const CARD_STYLE = { background: "#fff", border: "0.5px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }
const COR_PRIMARIA = "#1D9E75"

interface Projecao {
  ano_referencia: number
  fat_var_min_pct: number
  fat_var_max_pct: number
  fat_realizado_pct: number
}

function badgeProjecao(p: Projecao) {
  const superou = p.fat_realizado_pct > p.fat_var_max_pct
  const noAlvo = !superou && p.fat_realizado_pct >= p.fat_var_min_pct
  if (superou) return { label: "Superou", bg: "#E1F5EE", color: "#0F6E56" }
  if (noAlvo) return { label: "No alvo", bg: "#E6F1FB", color: "#185FA5" }
  return { label: "Abaixo", bg: "#FCEBEB", color: "#A32D2D" }
}

export function TabProjecoes({ projecoes }: { projecoes: Projecao[] }) {
  const sorted = useMemo(() => [...projecoes].sort((a, b) => a.ano_referencia - b.ano_referencia), [projecoes])
  const maxReal = useMemo(() => Math.max(...sorted.map((p) => p.fat_realizado_pct), 1), [sorted])

  // Insight
  const superouCount = sorted.filter((p) => p.fat_realizado_pct > p.fat_var_max_pct).length
  const totalAnos = sorted.length

  return (
    <>
      {/* Insight */}
      <div className="mb-5 p-4 rounded-xl" style={{ background: "#E1F5EE", border: "1px solid #c3e8d9" }}>
        <div className="text-sm font-medium" style={{ color: "#0F6E56" }}>
          O setor superou a projecao da ABF em {superouCount} dos ultimos {totalAnos} anos
        </div>
        <div className="text-xs mt-1" style={{ color: "#1D9E75" }}>
          Franchising consistentemente entrega acima das expectativas do proprio setor.
        </div>
      </div>

      <Card className="border-0 shadow-none" style={CARD_STYLE}>
        <CardContent className="p-6">
          <div className="text-[11px] uppercase tracking-[0.07em] font-medium mb-4" style={{ color: "#aaa" }}>
            Projecao ABF vs Resultado Realizado
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#eee] hover:bg-transparent">
                <TableHead className="text-[11px] uppercase text-[#bbb] font-medium">Ano</TableHead>
                <TableHead className="text-[11px] uppercase text-[#bbb] font-medium text-right">Projecao ABF</TableHead>
                <TableHead className="text-[11px] uppercase text-[#bbb] font-medium text-right">Realizado</TableHead>
                <TableHead className="text-[11px] uppercase text-[#bbb] font-medium" style={{ width: "30%" }}>Comparacao</TableHead>
                <TableHead className="text-[11px] uppercase text-[#bbb] font-medium text-right">Resultado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((p) => {
                const badge = badgeProjecao(p)
                const superou = p.fat_realizado_pct > p.fat_var_max_pct
                const projText = p.fat_var_min_pct === p.fat_var_max_pct ? `+${p.fat_var_min_pct}%` : `+${p.fat_var_min_pct}% a +${p.fat_var_max_pct}%`
                const barProj = (p.fat_var_max_pct / maxReal) * 100
                const barReal = (p.fat_realizado_pct / maxReal) * 100

                return (
                  <TableRow key={p.ano_referencia} className="border-b border-[#f5f5f2] hover:bg-transparent">
                    <TableCell className="font-medium" style={{ color: "#1a1a18" }}>{p.ano_referencia}</TableCell>
                    <TableCell className="text-right" style={{ color: "#999" }}>{projText}</TableCell>
                    <TableCell className="text-right font-medium" style={{ color: superou ? COR_PRIMARIA : "#1a1a18" }}>+{p.fat_realizado_pct}%</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 9, color: "#bbb", width: 20 }}>ABF</span>
                          <div className="flex-1 rounded-full" style={{ height: 5, background: "#f0efe9" }}>
                            <div className="rounded-full" style={{ height: "100%", width: `${barProj}%`, background: "#378ADD", opacity: 0.5 }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 9, color: "#bbb", width: 20 }}>Real</span>
                          <div className="flex-1 rounded-full" style={{ height: 5, background: "#f0efe9" }}>
                            <div className="rounded-full" style={{ height: "100%", width: `${barReal}%`, background: badge.color }} />
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-block text-[11px] font-medium rounded-full px-3 py-0.5" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
