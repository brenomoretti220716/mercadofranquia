"use client"

import { useState, useEffect, useRef } from "react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
  LineChart, Line, Legend,
} from "recharts"
import { InsightBox, h, GraficoRodape } from "@/components/insight-box"

const CARD = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" } as const
const P = "#E8421A"
const AZUL = "#2563EB"
const COVID = "#D32F2F"
const LIGHT = "#F4845F"

const CORES_REGIAO: Record<string, string> = {
  Sudeste: P, Sul: AZUL, Nordeste: "#FF9800", "Centro-Oeste": "#7C4DFF", Norte: "#00BCD4",
}
const ESTADO_REGIAO: Record<string, string> = {
  "São Paulo": "Sudeste", "Rio de Janeiro": "Sudeste", "Minas Gerais": "Sudeste", "Espírito Santo": "Sudeste",
  "Paraná": "Sul", "Santa Catarina": "Sul", "Rio Grande do Sul": "Sul",
  "Bahia": "Nordeste", "Pernambuco": "Nordeste", "Ceará": "Nordeste", "Maranhão": "Nordeste",
  "Paraíba": "Nordeste", "Rio Grande do Norte": "Nordeste", "Alagoas": "Nordeste", "Sergipe": "Nordeste", "Piauí": "Nordeste",
  "Goiás": "Centro-Oeste", "Mato Grosso": "Centro-Oeste", "Mato Grosso do Sul": "Centro-Oeste", "Distrito Federal": "Centro-Oeste",
  "Pará": "Norte", "Amazonas": "Norte", "Rondônia": "Norte", "Tocantins": "Norte", "Acre": "Norte", "Amapá": "Norte", "Roraima": "Norte",
}

const CORES_SEG: Record<string, string> = {
  "Saúde, Beleza e Bem-Estar": "#9C27B0", "Alimentação - FS": "#F7A072", "Serviços e Outros Negócios": "#455A64",
  "Moda": "#E91E63", "Alimentação - CD": "#F4845F", "Casa e Construção": "#2196F3",
  "Educação": "#00BCD4", "Hotelaria e Turismo": "#4CAF50", "Serviços Automotivos": "#607D8B",
  "Comunicação/TI": "#7C4DFF", "Entretenimento e Lazer": "#FF9800", "Limpeza e Conservação": "#795548",
}

const NAV_ITEMS = [
  { id: "s-setor", label: "Tamanho do Setor" },
  { id: "s-crescimento", label: "Crescimento" },
  { id: "s-economia", label: "vs Economia" },
  { id: "s-cenario", label: "Cenario" },
  { id: "s-regiao", label: "Por Regiao" },
  { id: "s-conclusao", label: "Conclusao" },
]

function Secao({ id, num, titulo }: { id: string; num: number; titulo: string }) {
  return (
    <div id={id} className="flex items-center gap-3 mb-5" style={{ paddingTop: 80, marginTop: -32 }}>
      <span className="inline-flex items-center justify-center shrink-0 font-bold text-white" style={{ width: 28, height: 28, borderRadius: "50%", background: P, fontSize: 13 }}>{num}</span>
      <h3 className="font-semibold uppercase tracking-wide" style={{ color: "#1A1A1A", fontSize: 18 }}>{titulo}</h3>
      <div className="flex-1 h-px" style={{ background: "#E5E5E5" }} />
    </div>
  )
}

function selicAnualizada(taxaDiaria: number) { return ((1 + taxaDiaria / 100) ** 252 - 1) * 100 }

interface Props {
  kpis: { label: string; valor: string; sub: string; cor: string }[]
  serieAnual: { periodo: string; valor_bi: number; parcial?: boolean }[]
  segmentos: { segmento: string; valor_mm: number }[]
  serieEmpregos: { ano: string; empregos: number; empregos_mi: number }[]
  indicadores: any[]
  anual: any[]
  pibTrimestral: any
  pibEstado: any
  selic: any
  ipca: any
  desemprego: any
  consumidorPainel: any
  projecoes: any[]
}

export function TabVisaoGeral({ kpis, serieAnual, segmentos, serieEmpregos, anual, pibTrimestral, pibEstado, selic, ipca, desemprego, consumidorPainel, projecoes }: Props) {
  const [activeNav, setActiveNav] = useState("s-setor")
  const [selectedSeg, setSelectedSeg] = useState<string | null>(null)

  // IntersectionObserver for nav pills
  useEffect(() => {
    const ids = NAV_ITEMS.map((n) => n.id)
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveNav(entry.target.id)
          }
        }
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0 }
    )
    for (const id of ids) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  // ── Dados processados ─────────────────────────────────────────────
  const totais = anual.filter((r: any) => r.segmento === "Total").sort((a: any, b: any) => a.periodo.localeCompare(b.periodo))

  const pibPorAno = new Map<string, number[]>()
  for (const d of (pibTrimestral?.dados || [])) {
    const ano = d.data.slice(0, 4)
    if (!pibPorAno.has(ano)) pibPorAno.set(ano, [])
    pibPorAno.get(ano)!.push(d.valor)
  }
  const serieFatVsPib: { ano: string; abf: number | null; pib: number | null }[] = []
  for (let i = 1; i < totais.length; i++) {
    const ano = totais[i].periodo.match(/(\d{4})/)?.[1] || ""
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

  const selicDados = selic?.dados || []
  const selicAtual = selicDados.length > 0 ? selicAnualizada(selicDados[selicDados.length - 1]?.valor) : 0
  const ipcaDados = ipca?.dados || []
  const ipca12m = ipcaDados.length >= 12 ? +((ipcaDados.slice(-12).reduce((acc: number, d: any) => acc * (1 + d.valor / 100), 1) - 1) * 100).toFixed(1) : 0
  const desempDados = desemprego?.dados || []
  const desempAtual = desempDados.length > 0 ? desempDados[desempDados.length - 1]?.valor : 0
  const iccDados = consumidorPainel?.icc?.dados || []
  const iccAtual = iccDados.length > 0 ? iccDados[iccDados.length - 1]?.valor : 0
  const endivDados = consumidorPainel?.endividamento?.dados || []
  const endivAtual = endivDados.length > 0 ? endivDados[endivDados.length - 1]?.valor : 0
  const massaDados = consumidorPainel?.massa_salarial?.dados || []
  const massaAtual = massaDados.length > 0 ? massaDados[massaDados.length - 1]?.valor : 0
  const massaBi = massaAtual / 1_000_000
  const massaVar12m = massaDados.length > 12 ? +(((massaAtual / massaDados[massaDados.length - 13]?.valor) - 1) * 100).toFixed(1) : 0

  const primeiro = serieAnual[0]
  const ultimoAnual = serieAnual.filter((s) => !s.parcial).pop() || serieAnual[serieAnual.length - 1]
  const crescTotal = primeiro && ultimoAnual ? Math.round(((ultimoAnual.valor_bi / primeiro.valor_bi) - 1) * 100) : 0
  const var2020 = (() => { const q = serieAnual.find((s) => s.periodo === "2020"), pp = serieAnual.find((s) => s.periodo === "2019"); return q && pp ? +((q.valor_bi / pp.valor_bi - 1) * 100).toFixed(1) : 0 })()
  const anosAcimaPib = serieFatVsPib.filter((s) => s.abf != null && s.pib != null && s.abf! > s.pib!).length
  const totalComp = serieFatVsPib.filter((s) => s.abf != null && s.pib != null).length
  const mediaSup = totalComp > 0 ? +(serieFatVsPib.filter((s) => s.abf != null && s.pib != null).reduce((a, s) => a + (s.abf! - s.pib!), 0) / totalComp).toFixed(1) : 0
  const top3Pib = top10.slice(0, 3).reduce((a: number, d: any) => a + d.valor_bi, 0)
  const totalPib10 = top10.reduce((a: number, d: any) => a + d.valor_bi, 0)
  const top3PibPct = totalPib10 > 0 ? Math.round((top3Pib / totalPib10) * 100) : 0

  const crescRecente = serieAnual.length >= 2 ? +((serieAnual[serieAnual.length - 1].valor_bi / serieAnual[serieAnual.length - 2].valor_bi - 1) * 100).toFixed(1) : 0
  const semaforoVerde = iccAtual > 110 && selicAtual < 12 && crescRecente > 8
  const semaforoVermelho = iccAtual < 90 || selicAtual > 14
  const semaforo = semaforoVerde ? "favoravel" : semaforoVermelho ? "cautela" : "neutro"
  const semaforoCor = semaforo === "favoravel" ? "#2E7D32" : semaforo === "cautela" ? COVID : "#F59E0B"
  const semaforoBg = semaforo === "favoravel" ? "#E8F5E9" : semaforo === "cautela" ? "#FFEBEE" : "#FFF8E1"
  const semaforoLabel = semaforo === "favoravel" ? "Favoravel" : semaforo === "cautela" ? "de Cautela" : "Neutro"

  const proj2025 = (projecoes || []).find((p: any) => p.ano_referencia === 2025)
  const superouCount = (projecoes || []).filter((p: any) => p.fat_realizado_pct > p.fat_var_max_pct).length
  const totalProj = (projecoes || []).length
  const totalFatSeg = segmentos.reduce((acc: number, s: any) => acc + s.valor_mm, 0)

  // Segmento selecionado
  const segDetalhe = selectedSeg ? segmentos.find((s: any) => s.segmento === selectedSeg) : null
  const segPosicao = selectedSeg ? segmentos.findIndex((s: any) => s.segmento === selectedSeg) + 1 : 0
  const segPct = segDetalhe && totalFatSeg > 0 ? +((segDetalhe.valor_mm / totalFatSeg) * 100).toFixed(1) : 0

  return (
    <>
      {/* ═══ BARRA NARRATIVA ═══ */}
      <div className="sticky z-10 py-2.5 px-3 mb-4 -mx-2 overflow-x-auto" style={{ top: 0, background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderRadius: 10 }}>
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item, i) => (
            <div key={item.id} className="flex items-center shrink-0">
              <a
                href={`#${item.id}`}
                className="px-3 py-1.5 font-semibold whitespace-nowrap transition-all"
                style={{
                  fontSize: 12,
                  background: activeNav === item.id ? P : "#F0F0F0",
                  color: activeNav === item.id ? "#fff" : "#666",
                  borderRadius: 6,
                }}
              >
                {item.label}
              </a>
              {i < NAV_ITEMS.length - 1 && <span className="mx-0.5" style={{ color: "#DDD", fontSize: 10 }}>→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ═══ SEÇÃO 1 — TAMANHO DO SETOR ═══ */}
      <Secao id="s-setor" num={1} titulo="Tamanho do Setor" />
      <div className="grid grid-cols-4 gap-4 mb-4">
        {kpis.map((k, i) => (
          <div key={i} className="p-5" style={CARD}>
            <div className="uppercase tracking-wider font-semibold mb-2" style={{ color: "#999", fontSize: 12 }}>{k.label}</div>
            <div className="font-bold" style={{ color: i === 0 ? P : "#1A1A1A", fontSize: 36 }}>{k.valor}</div>
            <div className="mt-1 font-medium" style={{ color: i === 0 ? P : "#999", fontSize: 12 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Pills de segmento */}
      <div className="overflow-x-auto mb-3 -mx-1 px-1">
        <div className="flex gap-1.5">
          {segmentos.map((s: any) => {
            const cor = CORES_SEG[s.segmento] || "#999"
            const active = selectedSeg === s.segmento
            return (
              <button
                key={s.segmento}
                onClick={() => setSelectedSeg(active ? null : s.segmento)}
                className="px-3 py-1 font-semibold whitespace-nowrap shrink-0 transition-all"
                style={{
                  fontSize: 11,
                  borderRadius: 20,
                  background: active ? cor : "#F5F5F5",
                  color: active ? "#fff" : "#666",
                  border: `1px solid ${active ? cor : "#E5E5E5"}`,
                }}
              >
                {s.segmento}
              </button>
            )
          })}
        </div>
      </div>

      {/* Mini card do segmento selecionado */}
      {selectedSeg && segDetalhe && (
        <div className="p-4 mb-4 flex items-center justify-between" style={{ ...CARD, borderLeft: `3px solid ${CORES_SEG[selectedSeg] || P}` }}>
          <div className="flex items-center gap-6">
            <div>
              <div style={{ fontSize: 12, color: "#999" }}>Faturamento</div>
              <div className="font-bold" style={{ fontSize: 22, color: "#1A1A1A" }}>R$ {(segDetalhe.valor_mm / 1000).toFixed(1)} bi</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#999" }}>Participacao</div>
              <div className="font-bold" style={{ fontSize: 22, color: "#1A1A1A" }}>{segPct}%</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#999" }}>Posicao</div>
              <div className="font-bold" style={{ fontSize: 22, color: P }}>#{segPosicao}</div>
            </div>
          </div>
          <span className="font-semibold cursor-pointer" style={{ fontSize: 12, color: P }}>
            Ver analise completa →
          </span>
        </div>
      )}

      {/* ═══ SEÇÃO 2 — CRESCIMENTO ═══ */}
      <Secao id="s-crescimento" num={2} titulo="11 Anos de Crescimento" />
      <InsightBox insights={[
        `O setor cresceu ${h(crescTotal + "%")} em 11 anos, de R$ ${h(primeiro?.valor_bi)} bi (${primeiro?.periodo}) para R$ ${h(ultimoAnual?.valor_bi)} bi (${ultimoAnual?.periodo})`,
        `Unico ano de queda: 2020 (${h(var2020 + "%")}) — recuperacao completa em 2021`,
      ]} />
      <div className="p-6" style={CARD}>
        <div className="font-semibold mb-4" style={{ color: "#999", fontSize: 13 }}>
          Faturamento anual — {primeiro?.periodo}-{serieAnual[serieAnual.length - 1]?.periodo} — R$ bilhoes
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={serieAnual} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis dataKey="periodo" tick={{ fontSize: 12, fill: "#999" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#BBB" }} tickLine={false} axisLine={false} />
            <Tooltip formatter={(value) => [`R$ ${value} bi`, "Faturamento"]} contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #eee" }} />
            <Bar dataKey="valor_bi" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {serieAnual.map((e) => <Cell key={e.periodo} fill={e.periodo === "2020" ? COVID : e.parcial ? LIGHT : P} opacity={e.parcial ? 0.6 : 1} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <GraficoRodape fonte="ABF" periodo={`${primeiro?.periodo}-${serieAnual[serieAnual.length - 1]?.periodo}`} nota="R$ bilhoes correntes · * parcial" />
      </div>

      {/* ═══ SEÇÃO 3 — VS ECONOMIA ═══ */}
      <Secao id="s-economia" num={3} titulo="Franchising Supera a Economia" />
      <InsightBox insights={[
        `Franchising cresceu em media ${h(mediaSup + "pp")} acima do PIB — em ${h(anosAcimaPib)} dos ultimos ${h(totalComp)} anos superou a economia`,
      ]} />
      <div className="p-6" style={CARD}>
        <div className="font-semibold mb-4" style={{ color: "#999", fontSize: 13 }}>
          Crescimento anual — Franchising ABF vs PIB Brasil — 2015-2024 (%)
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={serieFatVsPib} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis dataKey="ano" tick={{ fontSize: 12, fill: "#999" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#BBB" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name === "abf" ? "Franchising ABF" : "PIB Brasil"]} contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #eee" }} />
            <Legend formatter={(v) => (v === "abf" ? "Franchising ABF" : "PIB Brasil")} wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="abf" stroke={P} strokeWidth={2.5} dot={{ r: 4, fill: P, stroke: "#fff", strokeWidth: 2 }} />
            <Line type="monotone" dataKey="pib" stroke={AZUL} strokeWidth={1.8} strokeDasharray="5 5" dot={{ r: 3, fill: AZUL, stroke: "#fff", strokeWidth: 2 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
        <GraficoRodape fonte="ABF + BCB" periodo="2015-2024" />
      </div>

      {/* ═══ SEÇÃO 4 — CENÁRIO ═══ */}
      <Secao id="s-cenario" num={4} titulo="O Cenario Atual" />
      <InsightBox insights={[
        `Com ICC em ${h(iccAtual.toFixed(0))}, Selic em ${h(selicAtual.toFixed(1) + "%")}, IPCA em ${h(ipca12m + "%")} e desemprego em ${h(desempAtual.toFixed(1) + "%")}, o ambiente e ${h(semaforoLabel.toLowerCase())} para abertura de franquias`,
      ]} />
      <div className="grid grid-cols-4 gap-4 mb-4">
        {[
          { label: "ICC (Confianca)", valor: iccAtual.toFixed(0), badge: iccAtual > 110 ? "Favoravel" : iccAtual < 90 ? "Baixo" : "Neutro", bc: iccAtual > 110 ? "#2E7D32" : iccAtual < 90 ? COVID : "#F59E0B", bb: iccAtual > 110 ? "#E8F5E9" : iccAtual < 90 ? "#FFEBEE" : "#FFF8E1" },
          { label: "Selic % a.a.", valor: selicAtual.toFixed(1) + "%", badge: selicAtual < 10 ? "Credito barato" : selicAtual > 13 ? "Credito caro" : "Moderada", bc: selicAtual < 10 ? "#2E7D32" : selicAtual > 13 ? COVID : "#F59E0B", bb: selicAtual < 10 ? "#E8F5E9" : selicAtual > 13 ? "#FFEBEE" : "#FFF8E1" },
          { label: "IPCA 12 meses", valor: ipca12m + "%", badge: ipca12m > 4.5 ? "Acima da meta" : ipca12m < 3 ? "Abaixo" : "Na meta", bc: ipca12m > 4.5 ? COVID : "#2E7D32", bb: ipca12m > 4.5 ? "#FFEBEE" : "#E8F5E9" },
          { label: "Desemprego", valor: desempAtual.toFixed(1) + "%", badge: desempAtual < 7 ? "Baixo" : desempAtual > 10 ? "Alto" : "Moderado", bc: desempAtual < 7 ? "#2E7D32" : desempAtual > 10 ? COVID : "#F59E0B", bb: desempAtual < 7 ? "#E8F5E9" : desempAtual > 10 ? "#FFEBEE" : "#FFF8E1" },
        ].map((k) => (
          <div key={k.label} className="p-4" style={CARD}>
            <div className="uppercase tracking-wider font-semibold mb-1" style={{ color: "#999", fontSize: 11 }}>{k.label}</div>
            <div className="font-bold mb-2" style={{ color: "#1A1A1A", fontSize: 28 }}>{k.valor}</div>
            <span className="font-semibold px-2 py-0.5" style={{ fontSize: 11, background: k.bb, color: k.bc, borderRadius: 4 }}>{k.badge}</span>
          </div>
        ))}
      </div>

      {/* Consumidor */}
      <InsightBox insights={[
        `Massa salarial de R$ ${h(massaBi.toFixed(0) + " bi")} (${massaVar12m > 0 ? "+" : ""}${h(massaVar12m + "%")} em 12m) e endividamento em ${h(endivAtual.toFixed(1) + "%")} da renda`,
      ]} />
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Endividamento", valor: endivAtual.toFixed(1) + "%", sub: "da renda familiar", cor: endivAtual > 45 ? COVID : "#2E7D32" },
          { label: "Massa salarial real", valor: `R$ ${massaBi.toFixed(0)} bi`, sub: `${massaVar12m > 0 ? "+" : ""}${massaVar12m}% em 12m`, cor: massaVar12m > 0 ? "#2E7D32" : COVID },
          { label: "Empregos diretos", valor: serieEmpregos[serieEmpregos.length - 1]?.empregos_mi ? serieEmpregos[serieEmpregos.length - 1].empregos_mi + " mi" : "—", sub: "no franchising", cor: "#999" },
          { label: "ICC tendencia", valor: iccAtual > (iccDados.length > 3 ? iccDados[iccDados.length - 4]?.valor : 0) ? "Em alta" : "Estavel", sub: `${iccAtual.toFixed(0)} pts`, cor: iccAtual > 100 ? "#2E7D32" : "#F59E0B" },
        ].map((k) => (
          <div key={k.label} className="p-4" style={CARD}>
            <div className="uppercase tracking-wider font-semibold mb-1" style={{ color: "#999", fontSize: 11 }}>{k.label}</div>
            <div className="font-bold mb-1" style={{ color: "#1A1A1A", fontSize: 22 }}>{k.valor}</div>
            <div className="font-medium" style={{ color: k.cor, fontSize: 11 }}>{k.sub}</div>
          </div>
        ))}
      </div>
      <GraficoRodape fonte="BCB + FGV" periodo="ultimo disponivel" />

      {/* ═══ SEÇÃO 5 — REGIONAL ═══ */}
      <Secao id="s-regiao" num={5} titulo="Potencial por Regiao" />
      <InsightBox insights={[
        `${top10[0]?.estado}, ${top10[1]?.estado} e ${top10[2]?.estado} concentram ${h(top3PibPct + "%")} do PIB do top 10`,
      ]} />
      <div className="p-6" style={CARD}>
        <div className="flex items-center justify-between mb-5">
          <div className="font-semibold" style={{ color: "#999", fontSize: 13 }}>PIB por estado — Top 10 ({anoRecente})</div>
          <div className="flex gap-3">
            {regioes.map((r) => (
              <span key={r} className="flex items-center gap-1" style={{ fontSize: 11, color: "#888" }}>
                <span className="inline-block" style={{ width: 8, height: 8, borderRadius: 2, background: CORES_REGIAO[r] || "#999" }} />{r}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          {top10.map((d: any, i: number) => (
            <div key={d.estado} className="flex items-center gap-3">
              <span className="text-right shrink-0" style={{ fontSize: 12, color: i < 3 ? "#1A1A1A" : "#888", fontWeight: i < 3 ? 600 : 400, width: 130 }}>{d.estado}</span>
              <div className="flex-1 rounded-full" style={{ height: 10, background: "#F0F0F0" }}>
                <div className="rounded-full" style={{ height: "100%", width: `${(d.valor_bi / maxPib) * 100}%`, background: CORES_REGIAO[d.regiao] || "#999" }} />
              </div>
              <span className="shrink-0 font-semibold" style={{ fontSize: 12, color: "#1A1A1A", width: 80, textAlign: "right" }}>R$ {d.valor_bi.toFixed(0)} bi</span>
            </div>
          ))}
        </div>
        <GraficoRodape fonte="IBGE — Contas Regionais" periodo={anoRecente || "ultimo"} />
      </div>

      {/* ═══ SEÇÃO 6 — CONCLUSÃO ═══ */}
      <Secao id="s-conclusao" num={6} titulo="Momento e Projecao" />
      <div className="p-6" style={{ ...CARD, borderLeft: `4px solid ${semaforoCor}` }}>
        <div className="flex items-center gap-4 mb-5">
          <div className="flex items-center justify-center" style={{ width: 60, height: 60, borderRadius: "50%", background: semaforoBg }}>
            <span style={{ width: 26, height: 26, borderRadius: "50%", background: semaforoCor, display: "block" }} />
          </div>
          <div>
            <div className="font-bold" style={{ fontSize: 22, color: semaforoCor }}>Momento {semaforoLabel}</div>
            <div style={{ fontSize: 12, color: "#999" }}>Baseado em ICC, Selic e crescimento recente</div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 mb-5">
          {[
            { check: true, text: `Crescimento historico: ${crescTotal}% em 11 anos consecutivos` },
            { check: anosAcimaPib > totalComp / 2, text: `vs PIB: superou em ${anosAcimaPib} dos ultimos ${totalComp} anos` },
            { check: iccAtual > 100, text: `ICC: ${iccAtual.toFixed(0)} pontos (${iccAtual > 110 ? "favoravel" : iccAtual < 90 ? "desfavoravel" : "neutro"})` },
            { check: desempAtual < 8, text: `Desemprego: ${desempAtual.toFixed(1)}% (${desempAtual < 7 ? "minima historica" : "moderado"})` },
            { check: proj2025 ? proj2025.fat_realizado_pct > proj2025.fat_var_max_pct : false, text: proj2025 ? `Projecao 2025: ABF projeta +${proj2025.fat_var_min_pct}% a +${proj2025.fat_var_max_pct}%, realizado parcial +${proj2025.fat_realizado_pct}%` : "Sem projecao 2025" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span style={{ fontSize: 16 }}>{item.check ? "✅" : "⚠️"}</span>
              <span style={{ fontSize: 14, color: "#1A1A1A" }}>{item.text}</span>
            </div>
          ))}
        </div>

        {proj2025 && (
          <div className="p-4 mb-4" style={{ background: "#F8F8F8", borderRadius: 8 }}>
            <div className="uppercase tracking-wider font-semibold mb-1" style={{ fontSize: 11, color: "#999" }}>Projecao ABF 2025</div>
            <div className="flex items-center gap-3">
              <span style={{ fontSize: 14, color: "#999" }}>Projetado: +{proj2025.fat_var_min_pct}% a +{proj2025.fat_var_max_pct}%</span>
              <span className="font-bold" style={{ fontSize: 14, color: P }}>Realizado parcial: +{proj2025.fat_realizado_pct}%</span>
              {proj2025.fat_realizado_pct > proj2025.fat_var_max_pct && (
                <span className="font-semibold px-2 py-0.5" style={{ fontSize: 11, background: "#E8F5E9", color: "#2E7D32", borderRadius: 4 }}>Superou</span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-5">
          <span className="font-semibold px-3 py-1" style={{ fontSize: 12, background: "#FFF0ED", color: P, borderRadius: 6 }}>
            Setor superou projecao em {superouCount} dos ultimos {totalProj} anos
          </span>
        </div>

        <div className="font-bold" style={{ fontSize: 18, color: "#1A1A1A", lineHeight: 1.6 }}>
          {semaforo === "favoravel"
            ? "O conjunto de indicadores aponta para um momento positivo para investir em franquias — confianca alta, credito acessivel e setor em crescimento."
            : semaforo === "cautela"
              ? "Indicadores macro sugerem cautela — avalie bem o segmento e a regiao antes de investir. O setor continua crescendo, mas o custo de entrada esta elevado."
              : "Momento neutro — indicadores mistos. Oportunidades existem em segmentos especificos e regioes com maior potencial."}
        </div>

        <GraficoRodape fonte="ABF + BCB + FGV" periodo="ultimo disponivel" />
      </div>
    </>
  )
}
