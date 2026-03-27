"use client"

import { useState, useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

const CARD = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }
const CORES = ["#E8421A", "#F4845F", "#F7A072", "#2196F3", "#7C4DFF", "#00BCD4", "#FF9800", "#4CAF50", "#9E9E9E", "#795548", "#E91E63", "#607D8B"]
const COR_PRIMARIA = "#E8421A"
const COR_VAREJO = "#2196F3"
const COR_COVID = "#D32F2F"

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mt-8 mb-4">
      <h3 className="text-[11px] font-bold uppercase tracking-wide whitespace-nowrap" style={{ color: "#1A1A1A" }}>{children}</h3>
      <div className="flex-1 h-px" style={{ background: "#E5E5E5" }} />
    </div>
  )
}

function formatMes(d: string) {
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  const [a, m] = d.split("-")
  return `${meses[parseInt(m) - 1]}/${a.slice(2)}`
}

const COMPARATIVOS = [
  { titulo: "Saude/Beleza vs Farma/Cosmeticos", codigoPMC: "103155", segABF: ["Saúde, Beleza"] },
  { titulo: "Moda vs Tecidos/Vestuario", codigoPMC: "90673", segABF: ["Moda"] },
  { titulo: "Alimentacao vs Hiper/Super", codigoPMC: "90672", segABF: ["Alimentação"] },
  { titulo: "Casa/Construcao vs Moveis/Eletro", codigoPMC: "2759", segABF: ["Casa e Construção"] },
]

interface Props {
  segmentos: any[]
  segmentosAnual: any[]
  pmcData: any
}

export function TabSegmentos({ segmentos, segmentosAnual, pmcData }: Props) {
  const maxSeg = segmentos[0]?.valor_mm ?? 1
  const allNames = segmentos.map((s: any) => s.segmento)

  const crescimento = useMemo(() => {
    const getVal = (seg: string, per: string) => segmentosAnual.find((r: any) => r.segmento === seg && r.periodo === per)?.valor_mm ?? 0
    return segmentos
      .map((s: any) => {
        const v1 = getVal(s.segmento, "4T2022") || getVal(s.segmento, "2022")
        const v2 = getVal(s.segmento, "4T2024") || getVal(s.segmento, "2024") || getVal(s.segmento, "4T2023")
        const cresc = v1 > 0 ? +((v2 / v1 - 1) * 100).toFixed(1) : 0
        return { segmento: s.segmento, crescimento: cresc }
      })
      .filter((s) => s.crescimento !== 0)
      .sort((a, b) => b.crescimento - a.crescimento)
  }, [segmentos, segmentosAnual])

  const maxCresc = Math.max(...crescimento.map((s) => Math.abs(s.crescimento)), 1)
  const pmcDados = pmcData?.dados || []

  return (
    <>
      <SectionTitle>Ranking de Segmentos</SectionTitle>
      <div className="p-6 mb-4" style={CARD}>
        <div className="text-[11px] uppercase tracking-wider font-semibold mb-5" style={{ color: "#999" }}>Faturamento por segmento 2023 — R$ bilhoes</div>
        <div className="flex flex-col gap-3">
          {segmentos.map((r: any, i: number) => (
            <div key={r.segmento} className="flex items-center gap-3">
              <span className="text-right shrink-0 truncate" style={{ fontSize: 11, color: "#666", width: 180 }}>{r.segmento}</span>
              <div className="flex-1 rounded-full" style={{ height: 8, background: "#F0F0F0" }}>
                <div className="rounded-full" style={{ height: "100%", background: CORES[i % CORES.length], width: `${(r.valor_mm / maxSeg) * 100}%` }} />
              </div>
              <span className="shrink-0 font-semibold" style={{ fontSize: 11, color: "#1A1A1A", width: 70, textAlign: "right" }}>R$ {(r.valor_mm / 1000).toFixed(1)} bi</span>
            </div>
          ))}
        </div>
      </div>

      <SectionTitle>Crescimento por Segmento</SectionTitle>
      <div className="p-6 mb-4" style={CARD}>
        <div className="text-[11px] uppercase tracking-wider font-semibold mb-5" style={{ color: "#999" }}>Variacao % do faturamento — periodo recente</div>
        <div className="flex flex-col gap-3">
          {crescimento.map((s) => (
            <div key={s.segmento} className="flex items-center gap-3">
              <span className="text-right shrink-0 truncate" style={{ fontSize: 11, color: "#666", width: 180 }}>{s.segmento}</span>
              <div className="flex-1 rounded-full" style={{ height: 8, background: "#F0F0F0" }}>
                <div className="rounded-full" style={{ height: "100%", width: `${Math.max((Math.abs(s.crescimento) / maxCresc) * 100, 2)}%`, background: s.crescimento >= 0 ? CORES[allNames.indexOf(s.segmento) % CORES.length] : COR_COVID }} />
              </div>
              <span className="shrink-0 font-semibold" style={{ fontSize: 12, color: s.crescimento >= 0 ? COR_PRIMARIA : COR_COVID, width: 52, textAlign: "right" }}>{s.crescimento >= 0 ? "+" : ""}{s.crescimento}%</span>
            </div>
          ))}
        </div>
      </div>

      <SectionTitle>Franchising vs Varejo Geral (PMC)</SectionTitle>
      <div className="grid grid-cols-4 gap-3">
        {COMPARATIVOS.map((comp) => {
          const pmcFilt = pmcDados.filter((d: any) => d.codigo_segmento === comp.codigoPMC && d.variacao_mensal != null).sort((a: any, b: any) => a.data.localeCompare(b.data)).map((d: any) => ({ mes: d.data, pmc: d.variacao_mensal }))
          const ultimoPMC = pmcFilt[pmcFilt.length - 1]?.pmc ?? 0
          const step = Math.max(1, Math.floor(pmcFilt.length / 5))
          return (
            <div key={comp.codigoPMC} className="p-4" style={CARD}>
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "#999" }}>{comp.titulo}</div>
              <div className="text-xs font-semibold mb-2" style={{ color: COR_VAREJO }}>Varejo {ultimoPMC > 0 ? "+" : ""}{ultimoPMC.toFixed(1)}%</div>
              <ResponsiveContainer width="100%" height={90}>
                <LineChart data={pmcFilt} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="mes" tick={{ fontSize: 9, fill: "#ccc" }} tickLine={false} axisLine={false} tickFormatter={formatMes} interval={step} />
                  <YAxis tick={{ fontSize: 9, fill: "#ccc" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                  <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`, "PMC"]} labelFormatter={(l) => formatMes(String(l))} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #eee" }} />
                  <Line type="monotone" dataKey="pmc" stroke={COR_VAREJO} strokeWidth={1.5} strokeDasharray="6 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )
        })}
      </div>
    </>
  )
}
