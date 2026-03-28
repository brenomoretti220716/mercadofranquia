"use client"

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
  LineChart, Line, Legend,
} from "recharts"
import { InsightBox, h, GraficoRodape } from "@/components/insight-box"
import { TermometroTrimestral } from "@/components/termometro-trimestral"

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

function Secao({ titulo }: { titulo: string }) {
  return (
    <div className="flex items-center gap-3 mt-10 mb-3">
      <h3 className="font-semibold" style={{ color: "#1A1A1A", fontSize: 18 }}>{titulo}</h3>
      <div className="flex-1 h-px" style={{ background: "#E5E5E5" }} />
    </div>
  )
}

function Paragrafo({ children }: { children: React.ReactNode }) {
  return <p className="mb-5" style={{ fontSize: 14, color: "#444", lineHeight: 1.7 }}>{children}</p>
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
  trimestrais: any[]
}

export function TabVisaoGeral({ kpis, serieAnual, segmentos, anual, pibTrimestral, pibEstado, selic, ipca, desemprego, consumidorPainel, projecoes, serieEmpregos, trimestrais }: Props) {
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

  // Índice de oportunidade por estado
  const POP_EST: Record<string, number> = {
    "São Paulo": 44.4, "Rio de Janeiro": 16.1, "Minas Gerais": 20.5, "Paraná": 11.4,
    "Santa Catarina": 7.6, "Rio Grande do Sul": 10.9, "Bahia": 14.1, "Goiás": 7.2,
    "Pernambuco": 9.1, "Distrito Federal": 2.8, "Mato Grosso": 3.7, "Mato Grosso do Sul": 2.8,
    "Ceará": 9.2, "Espírito Santo": 4.1, "Maranhão": 7.1,
  }
  const estadosComIndice = top10.map((d: any) => {
    const pop = POP_EST[d.estado] || 5.0
    const pibPc = d.valor_bi / pop // bi / mi = R$ mil per capita
    return { ...d, pop, pibPc: +pibPc.toFixed(1) }
  })
  const maxPibPc = Math.max(...estadosComIndice.map((e: any) => e.pibPc), 1)
  const estadosComScore = estadosComIndice.map((e: any) => ({
    ...e,
    score: Math.round((e.pibPc / maxPibPc) * 10),
    badge: e.pibPc > maxPibPc * 0.7 ? "Alto" : e.pibPc > maxPibPc * 0.4 ? "Em expansao" : "Emergente",
    badgeCor: e.pibPc > maxPibPc * 0.7 ? P : e.pibPc > maxPibPc * 0.4 ? AZUL : "#FF9800",
    badgeBg: e.pibPc > maxPibPc * 0.7 ? "#FFF0ED" : e.pibPc > maxPibPc * 0.4 ? "#EBF5FF" : "#FFF8E1",
  }))

  return (
    <>
      {/* ═══ TERMÔMETRO TRIMESTRAL ═══ */}
      <TermometroTrimestral trimestrais={trimestrais} />

      {/* ═══ DESTAQUES DO ANO ═══ */}
      {(() => {
        // Card 1: Segmento do ano (líder por faturamento)
        const lider = segmentos[0]
        const liderBi = lider ? (lider.valor_mm / 1000).toFixed(1) : "0"

        // Card 2: Maior crescimento (calcular vs período anterior disponível)
        const segsCrescimento = segmentos.map((s: any) => {
          const anterior = anual.find((a: any) => a.segmento === s.segmento && a.tipo_dado === "anual" && a.periodo === "4T2023")
            || anual.find((a: any) => a.segmento === s.segmento && a.tipo_dado === "anual" && a.periodo === "4T2022")
          const crescPct = anterior ? +((s.valor_mm / anterior.valor_mm - 1) * 100).toFixed(1) : null
          return { ...s, crescPct }
        }).filter((s: any) => s.crescPct !== null)
        const maiorCresc = [...segsCrescimento].sort((a: any, b: any) => (b.crescPct ?? 0) - (a.crescPct ?? 0))[0]

        // Card 3: Total de empregos (último dado)
        const empUltimo = serieEmpregos[serieEmpregos.length - 1]
        const empAnterior = serieEmpregos.length >= 2 ? serieEmpregos[serieEmpregos.length - 2] : null
        const empVar = empAnterior ? +((empUltimo.empregos / empAnterior.empregos - 1) * 100).toFixed(1) : 0

        // Card 4: Pior desempenho
        const piorCresc = [...segsCrescimento].sort((a: any, b: any) => (a.crescPct ?? 0) - (b.crescPct ?? 0))[0]

        const DARK = { background: "#1A1A1A", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }

        return (
          <div className="grid grid-cols-4 gap-3 mb-4">
            {/* Segmento do Ano */}
            <div className="p-5 transition-all" style={{ ...DARK, border: "1px solid transparent" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = P }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "transparent" }}>
              <span className="inline-block font-semibold px-2 py-0.5 mb-3" style={{ fontSize: 10, background: "#166534", color: "#22C55E", borderRadius: 4 }}>#1 Segmento</span>
              <div className="mb-1" style={{ fontSize: 20 }}>🏆</div>
              <div className="font-bold text-white mb-1" style={{ fontSize: 14 }}>{lider?.segmento}</div>
              <div className="font-bold mb-1" style={{ fontSize: 22, color: P }}>R$ {liderBi} bi</div>
              <div className="font-medium" style={{ fontSize: 11, color: "#22C55E" }}>
                {totalFatSeg > 0 ? Math.round((lider?.valor_mm / totalFatSeg) * 100) : 0}% do setor
              </div>
            </div>

            {/* Maior Crescimento */}
            <div className="p-5 transition-all" style={{ ...DARK, border: "1px solid transparent" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = P }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "transparent" }}>
              <span className="inline-block font-semibold px-2 py-0.5 mb-3" style={{ fontSize: 10, background: "#7C2D12", color: P, borderRadius: 4 }}>#1 Crescimento</span>
              <div className="mb-1" style={{ fontSize: 20 }}>🚀</div>
              <div className="font-bold text-white mb-1" style={{ fontSize: 14 }}>{maiorCresc?.segmento || "—"}</div>
              <div className="font-bold mb-1" style={{ fontSize: 22, color: P }}>
                {maiorCresc?.crescPct != null ? `+${maiorCresc.crescPct}%` : "—"}
              </div>
              <div className="font-medium" style={{ fontSize: 11, color: "#22C55E" }}>vs periodo anterior</div>
            </div>

            {/* Empregos */}
            <div className="p-5 transition-all" style={{ ...DARK, border: "1px solid transparent" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = P }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "transparent" }}>
              <span className="inline-block font-semibold px-2 py-0.5 mb-3" style={{ fontSize: 10, background: "#1E3A5F", color: "#60A5FA", borderRadius: 4 }}>Impacto Social</span>
              <div className="mb-1" style={{ fontSize: 20 }}>🏳️</div>
              <div className="font-bold text-white mb-1" style={{ fontSize: 14 }}>Empregos Diretos</div>
              <div className="font-bold mb-1" style={{ fontSize: 22, color: P }}>
                {empUltimo?.empregos_mi ? `${empUltimo.empregos_mi} mi` : "—"}
              </div>
              <div className="font-medium" style={{ fontSize: 11, color: empVar >= 0 ? "#22C55E" : "#EF4444" }}>
                {empVar > 0 ? `+${empVar}%` : empVar < 0 ? `${empVar}%` : ""} vs ano anterior
              </div>
            </div>

            {/* Pior Desempenho */}
            <div className="p-5 transition-all" style={{ ...DARK, border: "1px solid transparent" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = P }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "transparent" }}>
              <span className="inline-block font-semibold px-2 py-0.5 mb-3" style={{ fontSize: 10, background: "#7F1D1D", color: "#EF4444", borderRadius: 4 }}>Atencao</span>
              <div className="mb-1" style={{ fontSize: 20 }}>⚠️</div>
              <div className="font-bold text-white mb-1" style={{ fontSize: 14 }}>{piorCresc?.segmento || "—"}</div>
              <div className="font-bold mb-1" style={{ fontSize: 22, color: piorCresc?.crescPct != null && piorCresc.crescPct < 0 ? "#EF4444" : P }}>
                {piorCresc?.crescPct != null ? `${piorCresc.crescPct > 0 ? "+" : ""}${piorCresc.crescPct}%` : "—"}
              </div>
              <div className="font-medium" style={{ fontSize: 11, color: "#EF4444" }}>Menor crescimento do setor</div>
            </div>
          </div>
        )
      })()}

      {/* ═══ O FRANCHISING EM NÚMEROS ═══ */}
      <Secao titulo="O Franchising Brasileiro em Numeros" />
      <Paragrafo>
        O franchising brasileiro e um dos mercados mais resilientes da economia. Com R$ {serieAnual[serieAnual.length - 1]?.valor_bi} bilhoes em faturamento e mais de 1,8 milhao de empregos diretos, o setor segue em expansao mesmo em cenarios adversos.
      </Paragrafo>
      <div className="grid grid-cols-4 gap-4 mb-4">
        {kpis.map((k, i) => (
          <div key={i} className="p-5" style={CARD}>
            <div className="uppercase tracking-wider font-semibold mb-2" style={{ color: "#999", fontSize: 12 }}>{k.label}</div>
            <div className="font-bold" style={{ color: i === 0 ? P : "#1A1A1A", fontSize: 36 }}>{k.valor}</div>
            <div className="mt-1 font-medium" style={{ color: i === 0 ? P : "#999", fontSize: 12 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ═══ UMA DÉCADA DE CRESCIMENTO ═══ */}
      <Secao titulo="Uma Decada de Crescimento Consistente" />
      <Paragrafo>
        Em 11 anos, o setor mais que dobrou seu faturamento — crescimento de {crescTotal}%. O unico recuo aconteceu em 2020, durante a pandemia, e a recuperacao foi completa ja no ano seguinte. Esse padrao de resiliencia e um dos principais atrativos para investidores que buscam previsibilidade.
      </Paragrafo>
      <InsightBox insights={[
        `Crescimento de ${h(crescTotal + "%")}: de R$ ${h(primeiro?.valor_bi)} bi (${primeiro?.periodo}) para R$ ${h(ultimoAnual?.valor_bi)} bi (${ultimoAnual?.periodo})`,
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

      {/* ═══ FRANCHISING VS ECONOMIA ═══ */}
      <Secao titulo="Franchising Cresce Mais que a Economia" />
      <Paragrafo>
        Enquanto o PIB brasileiro cresce a taxas modestas, o franchising consistentemente entrega resultados acima da media da economia. Essa diferenca — chamada de alfa do setor — indica que abrir uma franquia tende a ser mais rentavel que acompanhar o crescimento geral do mercado.
      </Paragrafo>
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

      {/* ═══ SEGMENTOS ═══ */}
      <Secao titulo="Onde Crescer: os 12 Segmentos" />
      <Paragrafo>
        Nao basta saber que o setor cresce — e preciso saber onde crescer. Os 12 segmentos do franchising tem dinamicas muito distintas. Entender cada segmento e fundamental para escolher a franquia certa.
      </Paragrafo>
      <div className="grid grid-cols-3 gap-3 mb-3">
        {segmentos.map((s: any, i: number) => {
          const cor = CORES_SEG[s.segmento] || "#999"
          const isLider = i === 0
          return (
            <div key={s.segmento} className="p-4 flex items-start justify-between" style={{ ...CARD, border: isLider ? `2px solid ${P}` : "1px solid #F0F0F0" }}>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate mb-1" style={{ fontSize: 12, color: "#1A1A1A" }}>{s.segmento}</div>
                <div className="font-bold" style={{ fontSize: 20, color: "#1A1A1A" }}>R$ {(s.valor_mm / 1000).toFixed(1)} bi</div>
                <div style={{ fontSize: 11, color: "#999" }}>{totalFatSeg > 0 ? ((s.valor_mm / totalFatSeg) * 100).toFixed(1) : 0}% do total</div>
              </div>
              <span className="font-bold shrink-0 ml-2 inline-flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: "50%", background: i < 3 ? P : "#F0F0F0", color: i < 3 ? "#fff" : "#999", fontSize: 11 }}>
                #{i + 1}
              </span>
            </div>
          )
        })}
      </div>
      <div className="text-right mb-2">
        <span className="font-semibold cursor-pointer" style={{ fontSize: 13, color: P }}>Analise detalhada por segmento →</span>
      </div>

      {/* ═══ CENÁRIO MACRO ═══ */}
      <Secao titulo="O Que os Indicadores Dizem Sobre Agora" />
      <Paragrafo>
        Os indicadores macroeconomicos determinam o apetite do consumidor e o custo de entrada para novos franqueados. Um ICC alto sinaliza disposicao para gastar; uma Selic elevada encarece o financiamento. Juntos, eles formam o termometro do momento.
      </Paragrafo>
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

      {/* ═══ POTENCIAL REGIONAL ═══ */}
      <Secao titulo="Onde Esta o Potencial no Brasil" />
      <Paragrafo>
        A concentracao economica brasileira define onde ha mais espaco para franquias. Sao Paulo sozinho representa mais PIB que muitos paises, mas regioes emergentes como Nordeste e Centro-Oeste apresentam taxas de crescimento acima da media — e menos saturacao de redes.
      </Paragrafo>
      <InsightBox insights={[
        `${top10[0]?.estado}, ${top10[1]?.estado} e ${top10[2]?.estado} concentram ${h(top3PibPct + "%")} do PIB do top 10 — maior potencial de mercado para franquias`,
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

      {/* ═══ ÍNDICE DE OPORTUNIDADE ═══ */}
      <Secao titulo="Onde Ha Mais Oportunidade?" />
      <Paragrafo>
        Estados com alto PIB per capita e menor saturacao de redes representam os maiores mercados em aberto. O indice combina poder de compra local com potencial de expansao.
      </Paragrafo>
      <InsightBox insights={[
        `${estadosComScore.filter((e: any) => e.badge === "Em expansao").map((e: any) => e.estado).join(", ")} apresentam PIB per capita crescente com menor saturacao — oportunidade para expansao de redes`,
      ]} />
      <div className="p-6 mb-2" style={CARD}>
        <div className="font-semibold mb-4" style={{ color: "#999", fontSize: 13 }}>Indice de Oportunidade por Estado</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #E5E5E5" }}>
              <th className="text-left font-bold py-2 px-2" style={{ color: "#666" }}>Estado</th>
              <th className="text-right font-bold py-2 px-2" style={{ color: "#666" }}>PIB (R$ bi)</th>
              <th className="text-right font-bold py-2 px-2" style={{ color: "#666" }}>PIB per capita</th>
              <th className="text-center font-bold py-2 px-2" style={{ color: "#666" }}>Indice</th>
              <th className="text-center font-bold py-2 px-2" style={{ color: "#666" }}>Classificacao</th>
            </tr>
          </thead>
          <tbody>
            {estadosComScore.map((e: any) => (
              <tr key={e.estado} style={{ borderBottom: "1px solid #F5F5F5" }}>
                <td className="py-2 px-2 font-medium" style={{ color: "#1A1A1A" }}>{e.estado}</td>
                <td className="text-right py-2 px-2" style={{ color: "#666" }}>R$ {e.valor_bi.toFixed(0)} bi</td>
                <td className="text-right py-2 px-2" style={{ color: "#666" }}>R$ {e.pibPc} mil</td>
                <td className="text-center py-2 px-2">
                  <span className="font-bold" style={{ color: P }}>{e.score}/10</span>
                </td>
                <td className="text-center py-2 px-2">
                  <span className="font-semibold px-2 py-0.5" style={{ fontSize: 11, background: e.badgeBg, color: e.badgeCor, borderRadius: 4 }}>
                    {e.badge}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3" style={{ fontSize: 10, color: "#CCC" }}>
          Indice calculado com base em PIB per capita estadual (IBGE {anoRecente}). Dados de unidades por estado serao incorporados em versao futura.
        </div>
        <GraficoRodape fonte="IBGE — Contas Regionais" periodo={anoRecente || "ultimo"} />
      </div>

      {/* ═══ O QUE ESPERAR DE 2025 ═══ */}
      <Secao titulo="Balanco 2025 e Perspectiva 2026" />
      <Paragrafo>
        O setor encerrou 2025 com R$ 302 bi em faturamento, superando a projecao da ABF pela quinta vez consecutiva. Para 2026, a ABF projeta crescimento de +8% a +10%. Abaixo, o balanco de fatores que sustentam — e que podem limitar — esse crescimento.
      </Paragrafo>

      {/* Duas colunas: Favoráveis vs Atenção */}
      {(() => {
        const favoraveis = [
          iccAtual > 100 ? `ICC em ${iccAtual.toFixed(0)} pontos — consumidor confiante` : null,
          desempAtual < 8 ? `Desemprego em ${desempAtual.toFixed(1)}% — proxima de minima historica` : null,
          massaVar12m > 0 ? `Massa salarial crescendo +${massaVar12m}%` : null,
          proj2025 && proj2025.fat_realizado_pct > proj2025.fat_var_max_pct ? `Setor ja superou projecao ABF em 2025` : null,
          anosAcimaPib > totalComp / 2 ? `Franchising superou PIB em ${anosAcimaPib} dos ultimos ${totalComp} anos` : null,
          crescTotal > 50 ? `Crescimento de ${crescTotal}% em 11 anos` : null,
        ].filter(Boolean) as string[]

        const atencao = [
          selicAtual > 12 ? `Selic em ${selicAtual.toFixed(1)}% — credito mais caro` : null,
          endivAtual > 45 ? `Endividamento das familias em ${endivAtual.toFixed(1)}% da renda` : null,
          Number(ipca12m) > 4.5 ? `IPCA de ${ipca12m}% — acima da meta de 3%` : null,
          iccAtual < 90 ? `ICC abaixo de 90 — consumidor retraido` : null,
          desempAtual > 10 ? `Desemprego acima de 10%` : null,
        ].filter(Boolean) as string[]

        const balanco = favoraveis.length > atencao.length ? "favoravel" : favoraveis.length < atencao.length ? "desfavoravel" : "equilibrado"

        return (
          <>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="p-5" style={{ background: "#F0FFF4", borderRadius: 12 }}>
                <div className="font-bold mb-3" style={{ fontSize: 14, color: "#2E7D32" }}>Pontos Favoraveis</div>
                <div className="flex flex-col gap-2">
                  {favoraveis.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span style={{ fontSize: 14, flexShrink: 0 }}>✅</span>
                      <span style={{ fontSize: 13, color: "#1A1A1A" }}>{f}</span>
                    </div>
                  ))}
                  {favoraveis.length === 0 && <span style={{ fontSize: 13, color: "#999" }}>Nenhum ponto claramente favoravel no momento</span>}
                </div>
              </div>
              <div className="p-5" style={{ background: "#FFFBEB", borderRadius: 12 }}>
                <div className="font-bold mb-3" style={{ fontSize: 14, color: "#92610E" }}>Pontos de Atencao</div>
                <div className="flex flex-col gap-2">
                  {atencao.map((a, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
                      <span style={{ fontSize: 13, color: "#1A1A1A" }}>{a}</span>
                    </div>
                  ))}
                  {atencao.length === 0 && <span style={{ fontSize: 13, color: "#999" }}>Nenhum ponto critico de atencao</span>}
                </div>
              </div>
            </div>

            {/* Semáforo de balanço */}
            <div className="p-5 mb-4" style={{ ...CARD, borderLeft: `4px solid ${semaforoCor}` }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center justify-center" style={{ width: 52, height: 52, borderRadius: "50%", background: semaforoBg }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: semaforoCor, display: "block" }} />
                </div>
                <div>
                  <div className="font-bold" style={{ fontSize: 20, color: semaforoCor }}>Momento {semaforoLabel}</div>
                  <div style={{ fontSize: 12, color: "#999" }}>{favoraveis.length} fatores positivos vs {atencao.length} fatores de atencao</div>
                </div>
              </div>

              {proj2025 && (
                <div className="p-4 mb-4" style={{ background: "#F8F8F8", borderRadius: 8 }}>
                  <div className="uppercase tracking-wider font-semibold mb-1" style={{ fontSize: 11, color: "#999" }}>Projecao ABF 2025</div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span style={{ fontSize: 14, color: "#999" }}>Projetado: +{proj2025.fat_var_min_pct}% a +{proj2025.fat_var_max_pct}%</span>
                    <span className="font-bold" style={{ fontSize: 14, color: P }}>Realizado parcial: +{proj2025.fat_realizado_pct}%</span>
                    {proj2025.fat_realizado_pct > proj2025.fat_var_max_pct && (
                      <span className="font-semibold px-2 py-0.5" style={{ fontSize: 11, background: "#E8F5E9", color: "#2E7D32", borderRadius: 4 }}>Superou</span>
                    )}
                  </div>
                </div>
              )}

              <span className="inline-block font-semibold px-3 py-1 mb-4" style={{ fontSize: 12, background: "#FFF0ED", color: P, borderRadius: 6 }}>
                Setor superou projecao em {superouCount} dos ultimos {totalProj} anos
              </span>

              <div className="font-bold" style={{ fontSize: 16, color: "#1A1A1A", lineHeight: 1.6 }}>
                {balanco === "favoravel"
                  ? "O setor apresenta fundamentos solidos para investimento. A confianca do consumidor e o crescimento consistente compensam o custo elevado do credito — mas prefira capital proprio a financiamento."
                  : balanco === "desfavoravel"
                    ? "Indicadores macro sugerem cautela. O setor continua crescendo, mas o custo de entrada esta elevado e o consumidor pressionado. Avalie bem o segmento e a regiao."
                    : "Momento equilibrado — fundamentos positivos coexistem com riscos. Oportunidades existem em segmentos especificos e regioes com maior potencial de demanda."}
              </div>

              <GraficoRodape fonte="ABF + BCB + FGV" periodo="ultimo disponivel" />
            </div>
          </>
        )
      })()}
    </>
  )
}
