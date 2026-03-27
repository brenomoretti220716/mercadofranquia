"use client"

import { useState, useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ErrorBar } from "recharts"
import { InsightBox, h, GraficoRodape } from "@/components/insight-box"

const P = "#E8421A"
const CINZA = "#DDD"
const CARD = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }

interface SegInvest {
  segmento: string
  total_franquias: number
  min: number
  mediana: number
  max: number
}

function fmtK(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  return `R$ ${Math.round(v / 1000)}k`
}

export function CustoEntradaSegmento({ dados }: { dados: SegInvest[] }) {
  const [orcamento, setOrcamento] = useState(200_000)

  const sorted = useMemo(() =>
    [...dados].sort((a, b) => a.mediana - b.mediana),
  [dados])

  const chartData = useMemo(() =>
    sorted.map((s) => ({
      segmento: s.segmento.length > 20 ? s.segmento.slice(0, 18) + "..." : s.segmento,
      segFull: s.segmento,
      mediana: Math.round(s.mediana / 1000),
      min: Math.round(s.min / 1000),
      max: Math.round(s.max / 1000),
      acessivel: s.min <= orcamento,
    })),
  [sorted, orcamento])

  const acessiveis = sorted.filter((s) => s.min <= orcamento).length
  const maisBarato = sorted[0]

  return (
    <>
      <InsightBox insights={[
        `Com ${h(fmtK(orcamento))} voce acessa ${h(acessiveis)} dos ${h(sorted.length)} segmentos. O mais acessivel e ${h(maisBarato?.segmento)} (a partir de ${h(fmtK(maisBarato?.min || 0))})`,
      ]} />

      <div className="p-6" style={CARD}>
        {/* Slider */}
        <div className="flex items-center gap-4 mb-5">
          <span className="uppercase tracking-wider font-semibold shrink-0" style={{ fontSize: 11, color: "#999" }}>Meu orcamento:</span>
          <input
            type="range"
            min={10000}
            max={2000000}
            step={10000}
            value={orcamento}
            onChange={(e) => setOrcamento(Number(e.target.value))}
            className="flex-1"
            style={{ accentColor: P }}
          />
          <span className="font-bold shrink-0" style={{ fontSize: 16, color: P, minWidth: 90, textAlign: "right" }}>{fmtK(orcamento)}</span>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={Math.max(sorted.length * 36, 300)}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#BBB" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}k`} />
            <YAxis type="category" dataKey="segmento" width={150} tick={{ fontSize: 11, fill: "#666" }} tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(value, name) => [fmtK(Number(value) * 1000), name === "mediana" ? "Mediana" : String(name)]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #eee" }}
            />
            <Bar dataKey="mediana" radius={[0, 4, 4, 0]} maxBarSize={20}>
              {chartData.map((e, i) => (
                <Cell key={i} fill={e.acessivel ? P : CINZA} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <GraficoRodape fonte="Portal do Franchising + Mercado Franquia" periodo="Mar/2026" nota={`Base: ${dados.reduce((a, d) => a + d.total_franquias, 0).toLocaleString("pt-BR")} franquias`} />
      </div>
    </>
  )
}
