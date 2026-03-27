"use client"

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
  LineChart, Line, Legend,
} from "recharts"
import { Card, CardContent } from "@/components/ui/card"

const CARD = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }
const COR_PRIMARIA = "#E8421A"
const COR_LARANJA_LIGHT = "#F4845F"
const COR_CINZA = "#999"
const COR_COVID = "#D32F2F"

const CORES_SEG = ["#E8421A", "#F4845F", "#F7A072", "#2196F3", "#7C4DFF", "#00BCD4", "#FF9800", "#4CAF50"]

const CORES_REGIAO: Record<string, string> = {
  Sudeste: "#E8421A", Sul: "#2196F3", Nordeste: "#FF9800", "Centro-Oeste": "#7C4DFF", Norte: "#00BCD4",
}
const ESTADO_REGIAO: Record<string, string> = {
  "São Paulo": "Sudeste", "Rio de Janeiro": "Sudeste", "Minas Gerais": "Sudeste", "Espírito Santo": "Sudeste",
  "Paraná": "Sul", "Santa Catarina": "Sul", "Rio Grande do Sul": "Sul",
  "Bahia": "Nordeste", "Pernambuco": "Nordeste", "Ceará": "Nordeste", "Maranhão": "Nordeste",
  "Paraíba": "Nordeste", "Rio Grande do Norte": "Nordeste", "Alagoas": "Nordeste", "Sergipe": "Nordeste", "Piauí": "Nordeste",
  "Goiás": "Centro-Oeste", "Mato Grosso": "Centro-Oeste", "Mato Grosso do Sul": "Centro-Oeste", "Distrito Federal": "Centro-Oeste",
  "Pará": "Norte", "Amazonas": "Norte", "Rondônia": "Norte", "Tocantins": "Norte", "Acre": "Norte", "Amapá": "Norte", "Roraima": "Norte",
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mt-8 mb-4">
      <h3 className="text-[11px] font-bold uppercase tracking-wide whitespace-nowrap" style={{ color: "#1A1A1A" }}>{children}</h3>
      <div className="flex-1 h-px" style={{ background: "#E5E5E5" }} />
    </div>
  )
}

function corBarra(p: string) {
  if (p === "2020") return COR_COVID
  if (p === "2024") return COR_PRIMARIA
  return COR_LARANJA_LIGHT
}

interface Props {
  kpis: { label: string; valor: string; sub: string; cor: string }[]
  serieAnual: { periodo: string; valor_bi: number }[]
  segmentos: { segmento: string; valor_mm: number }[]
  serieEmpregos: { ano: string; empregos: number; empregos_mi: number }[]
  indicadores: any[]
  anual: any[]
  pibTrimestral: any
  pibEstado: any
}

export function TabVisaoGeral({ kpis, serieAnual, segmentos, serieEmpregos, anual, pibTrimestral, pibEstado }: Props) {
  const maxSeg = segmentos[0]?.valor_mm ?? 1

  const totais = anual.filter((r: any) => r.segmento === "Total").sort((a: any, b: any) => a.periodo.localeCompare(b.periodo))
  const pibPorAno = new Map<string, number[]>()
  for (const d of (pibTrimestral?.dados || [])) {
    const ano = d.data.slice(0, 4)
    if (!pibPorAno.has(ano)) pibPorAno.set(ano, [])
    pibPorAno.get(ano)!.push(d.valor)
  }
  const serieFatVsPib: { ano: string; abf: number | null; pib: number | null }[] = []
  for (let i = 1; i < totais.length; i++) {
    const ano = totais[i].periodo.replace(/\D/g, "").slice(0, 4)
    const anoNum = parseInt(ano)
    if (anoNum < 2015 || anoNum > 2024) continue
    const crescAbf = ((totais[i].valor_mm / totais[i - 1].valor_mm) - 1) * 100
    const pv = pibPorAno.get(ano), pa = pibPorAno.get(String(anoNum - 1))
    let crescPib: number | null = null
    if (pv && pa && pv.length > 0 && pa.length > 0) crescPib = +((pv.reduce((a, b) => a + b, 0) / pv.length / (pa.reduce((a, b) => a + b, 0) / pa.length) - 1) * 100).toFixed(1)
    serieFatVsPib.push({ ano, abf: +crescAbf.toFixed(1), pib: crescPib })
  }

  const pibDados = pibEstado?.dados || []
  const anosDisp = [...new Set(pibDados.map((d: any) => d.data))].sort()
  const anoRecente = anosDisp[anosDisp.length - 1] as string
  const top10 = pibDados.filter((d: any) => d.data === anoRecente && d.valor > 0).sort((a: any, b: any) => b.valor - a.valor).slice(0, 10)
    .map((d: any) => ({ estado: d.localidade, valor_bi: d.valor / 1_000_000, regiao: ESTADO_REGIAO[d.localidade] || "Outros" }))
  const maxPib = top10[0]?.valor_bi ?? 1
  const regioes = [...new Set(top10.map((d: any) => d.regiao))] as string[]

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpis.map((k, i) => (
          <div key={i} className="p-5" style={CARD}>
            <div className="text-[11px] uppercase tracking-wider font-semibold mb-2" style={{ color: "#999" }}>{k.label}</div>
            <div className="text-3xl font-bold" style={{ color: "#1A1A1A" }}>{k.valor}</div>
            <div className="text-xs mt-1 font-medium" style={{ color: i === 0 ? COR_PRIMARIA : "#999" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <SectionTitle>Faturamento</SectionTitle>
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <div className="p-6" style={CARD}>
          <div className="text-[11px] uppercase tracking-wider font-semibold mb-4" style={{ color: "#999" }}>Faturamento anual — R$ bilhoes</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={serieAnual} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="periodo" tick={{ fontSize: 10, fill: "#BBB" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#BBB" }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value) => [`R$ ${value} bi`, "Faturamento"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #eee" }} />
              <Bar dataKey="valor_bi" radius={[4, 4, 0, 0]} maxBarSize={36}>
                {serieAnual.map((e) => <Cell key={e.periodo} fill={corBarra(e.periodo)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="p-6" style={CARD}>
          <div className="text-[11px] uppercase tracking-wider font-semibold mb-4" style={{ color: "#999" }}>Top segmentos 2023</div>
          <div className="flex flex-col gap-3">
            {segmentos.slice(0, 8).map((r, i) => (
              <div key={r.segmento}>
                <div className="flex justify-between mb-1">
                  <span style={{ fontSize: 11, color: "#666" }}>{r.segmento}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#1A1A1A" }}>R$ {(r.valor_mm / 1000).toFixed(1)} bi</span>
                </div>
                <div className="rounded-full" style={{ height: 6, background: "#F0F0F0" }}>
                  <div className="rounded-full" style={{ height: "100%", background: CORES_SEG[i], width: `${(r.valor_mm / maxSeg) * 100}%`, opacity: 1 - i * 0.07 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SectionTitle>Empregos Diretos</SectionTitle>
      <div className="p-6 mb-4" style={CARD}>
        <div className="text-[11px] uppercase tracking-wider font-semibold mb-4" style={{ color: "#999" }}>Evolucao de empregos diretos — milhoes</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={serieEmpregos} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis dataKey="ano" tick={{ fontSize: 10, fill: "#BBB" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#BBB" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => v.toFixed(1)} domain={["auto", "auto"]} />
            <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} mi`, "Empregos"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #eee" }} />
            <Line type="monotone" dataKey="empregos_mi" stroke={COR_PRIMARIA} strokeWidth={2.5} dot={{ r: 4, fill: COR_PRIMARIA, stroke: "#fff", strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <SectionTitle>Franchising vs PIB</SectionTitle>
      <div className="p-6 mb-4" style={CARD}>
        <div className="text-[11px] uppercase tracking-wider font-semibold mb-4" style={{ color: "#999" }}>Crescimento anual — Franchising ABF vs PIB Brasil (%)</div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={serieFatVsPib} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis dataKey="ano" tick={{ fontSize: 11, fill: "#BBB" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#BBB" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name === "abf" ? "Franchising ABF" : "PIB Brasil"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #eee" }} />
            <Legend formatter={(v) => (v === "abf" ? "Franchising ABF" : "PIB Brasil")} wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="abf" stroke={COR_PRIMARIA} strokeWidth={2.5} dot={{ r: 4, fill: COR_PRIMARIA, stroke: "#fff", strokeWidth: 2 }} />
            <Line type="monotone" dataKey="pib" stroke={COR_CINZA} strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3, fill: COR_CINZA, stroke: "#fff", strokeWidth: 2 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <SectionTitle>PIB por Estado</SectionTitle>
      <div className="p-6" style={CARD}>
        <div className="flex items-center justify-between mb-5">
          <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#999" }}>Top 10 ({anoRecente})</div>
          <div className="flex gap-3">
            {regioes.map((r) => (
              <span key={r} className="flex items-center gap-1" style={{ fontSize: 10, color: "#888" }}>
                <span className="inline-block" style={{ width: 8, height: 8, borderRadius: 2, background: CORES_REGIAO[r] || "#999" }} />{r}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          {top10.map((d: any, i: number) => (
            <div key={d.estado} className="flex items-center gap-3">
              <span className="text-right shrink-0" style={{ fontSize: 11, color: i < 3 ? "#1A1A1A" : "#888", fontWeight: i < 3 ? 600 : 400, width: 130 }}>{d.estado}</span>
              <div className="flex-1 rounded-full" style={{ height: 10, background: "#F0F0F0" }}>
                <div className="rounded-full" style={{ height: "100%", width: `${(d.valor_bi / maxPib) * 100}%`, background: CORES_REGIAO[d.regiao] || "#999" }} />
              </div>
              <span className="shrink-0 font-semibold" style={{ fontSize: 11, color: "#1A1A1A", width: 75, textAlign: "right" }}>R$ {d.valor_bi.toFixed(0)} bi</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
