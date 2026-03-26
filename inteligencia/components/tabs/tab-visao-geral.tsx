"use client"

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
  LineChart, Line, Legend,
} from "recharts"
import { Card, CardContent } from "@/components/ui/card"

const CARD_STYLE = { background: "#fff", border: "0.5px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }
const COR_PRIMARIA = "#1D9E75"
const COR_SECUNDARIA = "#378ADD"
const COR_CRESCIMENTO = "#5DCAA5"
const COR_COVID = "#E24B4A"

const CORES_REGIAO: Record<string, string> = {
  Sudeste: "#1D9E75", Sul: "#378ADD", Nordeste: "#D85A30", "Centro-Oeste": "#BA7517", Norte: "#534AB7",
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
      <h3 className="text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: "#1a1a18" }}>{children}</h3>
      <div className="flex-1 h-px" style={{ background: "#e0dfda" }} />
    </div>
  )
}

function corBarra(p: string) {
  if (p === "2020") return COR_COVID
  if (p === "2024") return COR_PRIMARIA
  return COR_CRESCIMENTO
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
  const CORES_SEG = ["#1D9E75", "#378ADD", "#534AB7", "#D85A30", "#BA7517", "#D4537E", "#639922", "#0F6E56"]

  // Franchising vs PIB
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

  // PIB por estado
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
      <div className="grid grid-cols-4 gap-3 mb-5">
        {kpis.map((k, i) => (
          <Card key={i} className="border-0 shadow-none" style={CARD_STYLE}>
            <CardContent className="p-4">
              <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "#aaa" }}>{k.label}</div>
              <div className="text-2xl font-medium" style={{ color: "#1a1a18" }}>{k.valor}</div>
              <div className="text-xs mt-1" style={{ color: k.cor }}>{k.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <SectionTitle>Faturamento</SectionTitle>
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <Card className="border-0 shadow-none" style={CARD_STYLE}>
          <CardContent className="p-6">
            <div className="text-[11px] uppercase tracking-[0.07em] font-medium mb-4" style={{ color: "#aaa" }}>Faturamento anual — R$ bilhoes</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={serieAnual} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0efe9" />
                <XAxis dataKey="periodo" tick={{ fontSize: 10, fill: "#bbb" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#bbb" }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => [`R$ ${value} bi`, "Faturamento"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #eee" }} />
                <Bar dataKey="valor_bi" radius={[3, 3, 0, 0]} maxBarSize={36}>
                  {serieAnual.map((e) => <Cell key={e.periodo} fill={corBarra(e.periodo)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none" style={CARD_STYLE}>
          <CardContent className="p-6">
            <div className="text-[11px] uppercase tracking-[0.07em] font-medium mb-4" style={{ color: "#aaa" }}>Top segmentos 2023</div>
            <div className="flex flex-col gap-3">
              {segmentos.slice(0, 8).map((r, i) => (
                <div key={r.segmento}>
                  <div className="flex justify-between mb-1">
                    <span style={{ fontSize: 11, color: "#555" }}>{r.segmento}</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: "#1a1a18" }}>R$ {(r.valor_mm / 1000).toFixed(1)} bi</span>
                  </div>
                  <div className="rounded-full" style={{ height: 6, background: "#f0efe9" }}>
                    <div className="rounded-full" style={{ height: "100%", background: CORES_SEG[i], width: `${(r.valor_mm / maxSeg) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <SectionTitle>Empregos Diretos</SectionTitle>
      <Card className="border-0 shadow-none mb-4" style={CARD_STYLE}>
        <CardContent className="p-6">
          <div className="text-[11px] uppercase tracking-[0.07em] font-medium mb-4" style={{ color: "#aaa" }}>Evolucao de empregos diretos — milhoes</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={serieEmpregos} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0efe9" />
              <XAxis dataKey="ano" tick={{ fontSize: 10, fill: "#bbb" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#bbb" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => v.toFixed(1)} domain={["auto", "auto"]} />
              <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} mi`, "Empregos"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #eee" }} />
              <Line type="monotone" dataKey="empregos_mi" stroke={COR_PRIMARIA} strokeWidth={2.5} dot={{ r: 4, fill: COR_PRIMARIA, stroke: "#fff", strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <SectionTitle>Franchising vs PIB</SectionTitle>
      <Card className="border-0 shadow-none mb-4" style={CARD_STYLE}>
        <CardContent className="p-6">
          <div className="text-[11px] uppercase tracking-[0.07em] font-medium mb-4" style={{ color: "#aaa" }}>Crescimento anual — Franchising ABF vs PIB Brasil (%)</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={serieFatVsPib} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0efe9" />
              <XAxis dataKey="ano" tick={{ fontSize: 11, fill: "#bbb" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#bbb" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
              <Tooltip formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name === "abf" ? "Franchising ABF" : "PIB Brasil"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #eee" }} />
              <Legend formatter={(v) => (v === "abf" ? "Franchising ABF" : "PIB Brasil")} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="abf" stroke={COR_PRIMARIA} strokeWidth={2.5} dot={{ r: 4, fill: COR_PRIMARIA, stroke: "#fff", strokeWidth: 2 }} />
              <Line type="monotone" dataKey="pib" stroke={COR_SECUNDARIA} strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3, fill: COR_SECUNDARIA, stroke: "#fff", strokeWidth: 2 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <SectionTitle>PIB por Estado</SectionTitle>
      <Card className="border-0 shadow-none" style={CARD_STYLE}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="text-[11px] uppercase tracking-[0.07em] font-medium" style={{ color: "#aaa" }}>Top 10 ({anoRecente})</div>
            <div className="flex gap-3">
              {regioes.map((r) => (
                <span key={r} className="flex items-center gap-1" style={{ fontSize: 10, color: "#888" }}>
                  <span className="inline-block rounded-sm" style={{ width: 8, height: 8, background: CORES_REGIAO[r] || "#999" }} />{r}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            {top10.map((d: any, i: number) => (
              <div key={d.estado} className="flex items-center gap-3">
                <span className="text-right shrink-0" style={{ fontSize: 11, color: i < 3 ? "#1a1a18" : "#888", fontWeight: i < 3 ? 500 : 400, width: 130 }}>{d.estado}</span>
                <div className="flex-1 rounded-full" style={{ height: 10, background: "#f0efe9" }}>
                  <div className="rounded-full" style={{ height: "100%", width: `${(d.valor_bi / maxPib) * 100}%`, background: CORES_REGIAO[d.regiao] || "#999" }} />
                </div>
                <span className="shrink-0 font-medium" style={{ fontSize: 11, color: "#1a1a18", width: 75, textAlign: "right" }}>R$ {d.valor_bi.toFixed(0)} bi</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
