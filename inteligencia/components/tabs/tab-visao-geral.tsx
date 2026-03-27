"use client"

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

const ETAPAS = [
  { num: 1, icon: "📊", titulo: "O Setor", desc: "dimensao e impacto do franchising no Brasil" },
  { num: 2, icon: "📈", titulo: "Trajetoria", desc: "11 anos de crescimento historico" },
  { num: 3, icon: "⚡", titulo: "vs Economia", desc: "comparativo com o PIB brasileiro" },
  { num: 4, icon: "🏦", titulo: "Ambiente Macro", desc: "indicadores economicos que afetam o setor" },
  { num: 5, icon: "🗺️", titulo: "Potencial Regional", desc: "onde ha mais oportunidade no Brasil" },
  { num: 6, icon: "🎯", titulo: "Conclusao", desc: "momento atual e projecao para 2025" },
]

function Secao({ num, titulo, id }: { num: number; titulo: string; id?: string }) {
  return (
    <div id={id} className="flex items-center gap-3 mt-10 mb-5">
      <span className="inline-flex items-center justify-center shrink-0 text-xs font-bold text-white" style={{ width: 26, height: 26, borderRadius: "50%", background: P }}>{num}</span>
      <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: "#1A1A1A" }}>{titulo}</h3>
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

  // Macro KPIs
  const selicDados = selic?.dados || []
  const selicAtual = selicDados.length > 0 ? selicAnualizada(selicDados[selicDados.length - 1]?.valor) : 0
  const ipcaDados = ipca?.dados || []
  const ipca12m = ipcaDados.length >= 12 ? +((ipcaDados.slice(-12).reduce((acc: number, d: any) => acc * (1 + d.valor / 100), 1) - 1) * 100).toFixed(1) : 0
  const desempDados = desemprego?.dados || []
  const desempAtual = desempDados.length > 0 ? desempDados[desempDados.length - 1]?.valor : 0
  const iccDados = consumidorPainel?.icc?.dados || []
  const iccAtual = iccDados.length > 0 ? iccDados[iccDados.length - 1]?.valor : 0

  // Consumidor
  const endivDados = consumidorPainel?.endividamento?.dados || []
  const endivAtual = endivDados.length > 0 ? endivDados[endivDados.length - 1]?.valor : 0
  const massaDados = consumidorPainel?.massa_salarial?.dados || []
  const massaAtual = massaDados.length > 0 ? massaDados[massaDados.length - 1]?.valor : 0
  const massaBi = massaAtual / 1_000_000
  const massaVar12m = massaDados.length > 12 ? +(((massaAtual / massaDados[massaDados.length - 13]?.valor) - 1) * 100).toFixed(1) : 0

  // Insights
  const primeiro = serieAnual[0]
  const ultimoAnual = serieAnual.filter((s) => !s.parcial).pop() || serieAnual[serieAnual.length - 1]
  const crescTotal = primeiro && ultimoAnual ? Math.round(((ultimoAnual.valor_bi / primeiro.valor_bi) - 1) * 100) : 0
  const var2020 = (() => { const q = serieAnual.find((s) => s.periodo === "2020"), p = serieAnual.find((s) => s.periodo === "2019"); return q && p ? +((q.valor_bi / p.valor_bi - 1) * 100).toFixed(1) : 0 })()
  const anosAcimaPib = serieFatVsPib.filter((s) => s.abf != null && s.pib != null && s.abf! > s.pib!).length
  const totalComp = serieFatVsPib.filter((s) => s.abf != null && s.pib != null).length
  const mediaSup = totalComp > 0 ? +(serieFatVsPib.filter((s) => s.abf != null && s.pib != null).reduce((a, s) => a + (s.abf! - s.pib!), 0) / totalComp).toFixed(1) : 0
  const top3Pib = top10.slice(0, 3).reduce((a: number, d: any) => a + d.valor_bi, 0)
  const totalPib10 = top10.reduce((a: number, d: any) => a + d.valor_bi, 0)
  const top3PibPct = totalPib10 > 0 ? Math.round((top3Pib / totalPib10) * 100) : 0

  // Semáforo
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

  return (
    <>
      {/* ═══ INTRODUÇÃO ═══ */}
      <div className="p-5 mb-2" style={{ background: "#FFF8F6", borderRadius: 12, border: "1px solid #FFE4DB" }}>
        <div className="text-sm font-bold mb-3" style={{ color: "#1A1A1A" }}>Como ler este painel</div>
        <div className="text-xs mb-3" style={{ color: "#666" }}>
          Este painel conta a historia completa do franchising brasileiro em 6 etapas, do tamanho do setor ate a conclusao sobre o momento atual de investimento.
        </div>
        <div className="grid grid-cols-6 gap-2">
          {ETAPAS.map((e) => (
            <div key={e.num} className="flex flex-col items-center text-center gap-1">
              <span className="inline-flex items-center justify-center text-[10px] font-bold text-white" style={{ width: 22, height: 22, borderRadius: "50%", background: P }}>{e.num}</span>
              <span className="text-[10px] font-semibold" style={{ color: "#1A1A1A" }}>{e.titulo}</span>
              <span className="text-[9px]" style={{ color: "#999" }}>{e.desc}</span>
            </div>
          ))}
        </div>
        <div className="text-right mt-3">
          <a href="#conclusao" className="text-xs font-semibold" style={{ color: P }}>Ir para conclusao ↓</a>
        </div>
      </div>

      {/* ═══ SEÇÃO 1 — O SETOR EM NÚMEROS ═══ */}
      <Secao num={1} titulo="O Setor em Numeros" />
      <div className="grid grid-cols-4 gap-4 mb-2">
        {kpis.map((k, i) => (
          <div key={i} className="p-5" style={CARD}>
            <div className="text-[11px] uppercase tracking-wider font-semibold mb-2" style={{ color: "#999" }}>{k.label}</div>
            <div className="text-3xl font-bold" style={{ color: "#1A1A1A" }}>{k.valor}</div>
            <div className="text-xs mt-1 font-medium" style={{ color: i === 0 ? P : "#999" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ═══ SEÇÃO 2 — CRESCIMENTO ═══ */}
      <Secao num={2} titulo="11 Anos de Crescimento Consistente" />
      <InsightBox insights={[
        `O setor cresceu ${h(crescTotal + "%")} em 11 anos, de R$ ${h(primeiro?.valor_bi)} bi (${primeiro?.periodo}) para R$ ${h(ultimoAnual?.valor_bi)} bi (${ultimoAnual?.periodo})`,
        `Unico ano de queda: 2020 (${h(var2020 + "%")}) — recuperacao completa em 2021`,
      ]} />
      <div className="p-6" style={CARD}>
        <div className="text-[11px] uppercase tracking-wider font-semibold mb-4" style={{ color: "#999" }}>
          Faturamento anual — {primeiro?.periodo}-{serieAnual[serieAnual.length - 1]?.periodo} — R$ bilhoes
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={serieAnual} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis dataKey="periodo" tick={{ fontSize: 10, fill: "#BBB" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#BBB" }} tickLine={false} axisLine={false} />
            <Tooltip formatter={(value) => [`R$ ${value} bi`, "Faturamento"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #eee" }} />
            <Bar dataKey="valor_bi" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {serieAnual.map((e) => <Cell key={e.periodo} fill={e.periodo === "2020" ? COVID : e.parcial ? LIGHT : P} opacity={e.parcial ? 0.6 : 1} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <GraficoRodape fonte="ABF" periodo={`${primeiro?.periodo}-${serieAnual[serieAnual.length - 1]?.periodo}`} nota="R$ bilhoes correntes · * parcial" />
      </div>

      {/* ═══ SEÇÃO 3 — VS ECONOMIA ═══ */}
      <Secao num={3} titulo="Franchising Supera a Economia" />
      <InsightBox insights={[
        `Franchising cresceu em media ${h(mediaSup + "pp")} acima do PIB — em ${h(anosAcimaPib)} dos ultimos ${h(totalComp)} anos superou a economia`,
      ]} />
      <div className="p-6" style={CARD}>
        <div className="text-[11px] uppercase tracking-wider font-semibold mb-4" style={{ color: "#999" }}>
          Crescimento anual — Franchising ABF vs PIB Brasil — 2015-2024 (%)
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={serieFatVsPib} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis dataKey="ano" tick={{ fontSize: 11, fill: "#BBB" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#BBB" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name === "abf" ? "Franchising ABF" : "PIB Brasil"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #eee" }} />
            <Legend formatter={(v) => (v === "abf" ? "Franchising ABF" : "PIB Brasil")} wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="abf" stroke={P} strokeWidth={2.5} dot={{ r: 4, fill: P, stroke: "#fff", strokeWidth: 2 }} />
            <Line type="monotone" dataKey="pib" stroke={AZUL} strokeWidth={1.8} strokeDasharray="5 5" dot={{ r: 3, fill: AZUL, stroke: "#fff", strokeWidth: 2 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
        <GraficoRodape fonte="ABF + BCB" periodo="2015-2024" />
      </div>

      {/* ═══ SEÇÃO 4 — AMBIENTE MACRO ═══ */}
      <Secao num={4} titulo="O Ambiente Macro Atual" />
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
            <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "#999" }}>{k.label}</div>
            <div className="text-2xl font-bold mb-2" style={{ color: "#1A1A1A" }}>{k.valor}</div>
            <span className="text-[10px] font-semibold px-2 py-0.5" style={{ background: k.bb, color: k.bc, borderRadius: 4 }}>{k.badge}</span>
          </div>
        ))}
      </div>

      {/* Consumidor e Emprego */}
      <InsightBox insights={[
        `Com massa salarial de R$ ${h(massaBi.toFixed(0) + " bi")} (${massaVar12m > 0 ? "+" : ""}${h(massaVar12m + "%")} em 12m) e endividamento em ${h(endivAtual.toFixed(1) + "%")} da renda, o consumidor tem ${endivAtual < 45 ? "margem" : "pouca margem"} para investir em franquias`,
      ]} />
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Endividamento", valor: endivAtual.toFixed(1) + "%", sub: "da renda familiar", cor: endivAtual > 45 ? COVID : "#2E7D32" },
          { label: "Massa salarial real", valor: `R$ ${massaBi.toFixed(0)} bi`, sub: massaVar12m > 0 ? `+${massaVar12m}% em 12m` : `${massaVar12m}% em 12m`, cor: massaVar12m > 0 ? "#2E7D32" : COVID },
          { label: "Empregos diretos", valor: serieEmpregos[serieEmpregos.length - 1]?.empregos_mi ? serieEmpregos[serieEmpregos.length - 1].empregos_mi + " mi" : "—", sub: "no franchising", cor: "#999" },
          { label: "ICC tendencia", valor: iccAtual > (iccDados.length > 3 ? iccDados[iccDados.length - 4]?.valor : 0) ? "Em alta" : "Estavel", sub: `${iccAtual.toFixed(0)} pontos`, cor: iccAtual > 100 ? "#2E7D32" : "#F59E0B" },
        ].map((k) => (
          <div key={k.label} className="p-4" style={CARD}>
            <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "#999" }}>{k.label}</div>
            <div className="text-xl font-bold mb-1" style={{ color: "#1A1A1A" }}>{k.valor}</div>
            <div className="text-[10px] font-medium" style={{ color: k.cor }}>{k.sub}</div>
          </div>
        ))}
      </div>
      <GraficoRodape fonte="BCB + FGV" periodo="ultimo disponivel" />

      {/* ═══ SEÇÃO 5 — POTENCIAL REGIONAL ═══ */}
      <Secao num={5} titulo="Potencial por Regiao" />
      <InsightBox insights={[
        `${top10[0]?.estado}, ${top10[1]?.estado} e ${top10[2]?.estado} concentram ${h(top3PibPct + "%")} do PIB do top 10 — maior potencial de mercado para franquias`,
      ]} />
      <div className="p-6" style={CARD}>
        <div className="flex items-center justify-between mb-5">
          <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#999" }}>PIB por estado — Top 10 ({anoRecente})</div>
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
        <GraficoRodape fonte="IBGE — Contas Regionais" periodo={anoRecente || "ultimo"} />
      </div>

      {/* ═══ SEÇÃO 6 — CONCLUSÃO ═══ */}
      <Secao num={6} titulo="Momento e Projecao" id="conclusao" />
      <div className="p-6" style={{ ...CARD, borderLeft: `4px solid ${semaforoCor}` }}>
        {/* Semáforo grande */}
        <div className="flex items-center gap-4 mb-5">
          <div className="flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: "50%", background: semaforoBg }}>
            <span style={{ width: 24, height: 24, borderRadius: "50%", background: semaforoCor, display: "block" }} />
          </div>
          <div>
            <div className="font-bold" style={{ fontSize: 18, color: semaforoCor }}>
              Momento {semaforoLabel}
            </div>
            <div className="text-xs" style={{ color: "#999" }}>Baseado em ICC, Selic e crescimento recente</div>
          </div>
        </div>

        {/* Checklist */}
        <div className="flex flex-col gap-2 mb-5">
          {[
            { check: true, text: `Crescimento historico: ${crescTotal}% em 11 anos consecutivos` },
            { check: anosAcimaPib > totalComp / 2, text: `vs PIB: superou em ${anosAcimaPib} dos ultimos ${totalComp} anos` },
            { check: iccAtual > 100, text: `ICC: ${iccAtual.toFixed(0)} pontos (${iccAtual > 110 ? "favoravel" : iccAtual < 90 ? "desfavoravel" : "neutro"})` },
            { check: desempAtual < 8, text: `Desemprego: ${desempAtual.toFixed(1)}% (${desempAtual < 7 ? "minima historica" : "moderado"})` },
            { check: proj2025 ? proj2025.fat_realizado_pct > proj2025.fat_var_max_pct : false, text: proj2025 ? `Projecao 2025: ABF projeta +${proj2025.fat_var_min_pct}% a +${proj2025.fat_var_max_pct}%, realizado parcial +${proj2025.fat_realizado_pct}%` : "Sem projecao 2025" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span style={{ color: item.check ? "#2E7D32" : "#F59E0B", fontSize: 14 }}>{item.check ? "✅" : "⚠️"}</span>
              <span className="text-xs" style={{ color: "#1A1A1A" }}>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Projeção 2025 */}
        {proj2025 && (
          <div className="p-4 mb-4" style={{ background: "#F8F8F8", borderRadius: 8 }}>
            <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "#999" }}>Projecao ABF 2025</div>
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{ color: "#999" }}>Projetado: +{proj2025.fat_var_min_pct}% a +{proj2025.fat_var_max_pct}%</span>
              <span className="text-sm font-bold" style={{ color: P }}>Realizado parcial: +{proj2025.fat_realizado_pct}%</span>
              {proj2025.fat_realizado_pct > proj2025.fat_var_max_pct && (
                <span className="text-[10px] font-semibold px-2 py-0.5" style={{ background: "#E8F5E9", color: "#2E7D32", borderRadius: 4 }}>Superou</span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-semibold px-2 py-0.5" style={{ background: "#FFF0ED", color: P, borderRadius: 4 }}>
            Setor superou projecao em {superouCount} dos ultimos {totalProj} anos
          </span>
        </div>

        {/* Conclusão em destaque */}
        <div className="font-bold" style={{ fontSize: 18, color: "#1A1A1A", lineHeight: 1.5 }}>
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
