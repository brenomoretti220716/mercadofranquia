"use client"

import { useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InsightBox, h, GraficoRodape } from "@/components/insight-box"

const CARD = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }
const COR_PRIMARIA = "#E8421A"

interface Projecao {
  ano_referencia: number
  fat_var_min_pct: number
  fat_var_max_pct: number
  fat_realizado_pct: number
}

function badgeProjecao(p: Projecao) {
  const superou = p.fat_realizado_pct > p.fat_var_max_pct
  const noAlvo = !superou && p.fat_realizado_pct >= p.fat_var_min_pct
  if (superou) return { label: "Superou", bg: "#E8F5E9", color: "#2E7D32" }
  if (noAlvo) return { label: "No alvo", bg: "#FFF0ED", color: "#E8421A" }
  return { label: "Abaixo", bg: "#FFEBEE", color: "#C62828" }
}

export function TabProjecoes({ projecoes }: { projecoes: Projecao[] }) {
  const sorted = useMemo(() => [...projecoes].sort((a, b) => a.ano_referencia - b.ano_referencia), [projecoes])
  const maxReal = useMemo(() => Math.max(...sorted.map((p) => p.fat_realizado_pct), 1), [sorted])

  const superouCount = sorted.filter((p) => p.fat_realizado_pct > p.fat_var_max_pct).length
  const totalAnos = sorted.length
  const mediaSuperacao = sorted.length > 0
    ? +(sorted.reduce((acc, p) => acc + (p.fat_realizado_pct - p.fat_var_max_pct), 0) / sorted.length).toFixed(1)
    : 0
  const ultimo2025 = sorted.find((p) => p.ano_referencia === 2025)

  return (
    <>
      <InsightBox insights={[
        `O setor superou a projecao da ABF em ${h(superouCount)} dos ultimos ${h(totalAnos)} anos`,
        `Media de superacao: ${h("+" + mediaSuperacao + "pp")} acima do teto projetado`,
        ...(ultimo2025 ? [`2025: projecao de +${ultimo2025.fat_var_min_pct}% a +${ultimo2025.fat_var_max_pct}% vs realizado parcial de ${h("+" + ultimo2025.fat_realizado_pct + "%")} — caminho para superar novamente`] : []),
      ]} />

      <div className="p-6" style={CARD}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#999" }}>Projecao ABF vs Resultado Realizado</div>
          <span style={{ fontSize: 10, color: "#BBB" }}>Fonte: ABF 2021-2025</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#E5E5E5] hover:bg-transparent">
              <TableHead className="text-[11px] uppercase text-[#BBB] font-semibold">Ano</TableHead>
              <TableHead className="text-[11px] uppercase text-[#BBB] font-semibold text-right">Projecao ABF</TableHead>
              <TableHead className="text-[11px] uppercase text-[#BBB] font-semibold text-right">Realizado</TableHead>
              <TableHead className="text-[11px] uppercase text-[#BBB] font-semibold" style={{ width: "30%" }}>Comparacao</TableHead>
              <TableHead className="text-[11px] uppercase text-[#BBB] font-semibold text-right">Resultado</TableHead>
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
                <TableRow key={p.ano_referencia} className="border-b border-[#F5F5F5] hover:bg-transparent">
                  <TableCell className="font-semibold" style={{ color: "#1A1A1A" }}>{p.ano_referencia}</TableCell>
                  <TableCell className="text-right" style={{ color: "#999" }}>{projText}</TableCell>
                  <TableCell className="text-right font-semibold" style={{ color: superou ? "#2E7D32" : "#1A1A1A" }}>+{p.fat_realizado_pct}%</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 9, color: "#BBB", width: 20 }}>ABF</span>
                        <div className="flex-1 rounded-full" style={{ height: 5, background: "#F0F0F0" }}>
                          <div className="rounded-full" style={{ height: "100%", width: `${barProj}%`, background: "#2196F3", opacity: 0.5 }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 9, color: "#BBB", width: 20 }}>Real</span>
                        <div className="flex-1 rounded-full" style={{ height: 5, background: "#F0F0F0" }}>
                          <div className="rounded-full" style={{ height: "100%", width: `${barReal}%`, background: badge.color }} />
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-block text-[11px] font-semibold rounded-full px-3 py-0.5" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        <GraficoRodape fonte="ABF" periodo={`${sorted[0]?.ano_referencia}-${sorted[sorted.length - 1]?.ano_referencia}`} />
      </div>
    </>
  )
}
