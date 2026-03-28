"use client"

import { useMemo } from "react"
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  BarChart, Bar, Cell,
} from "recharts"
import { InsightBox, h, GraficoRodape } from "@/components/insight-box"

const CARD = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }
const P = "#E8421A"
const AZUL = "#2563EB"
const VERDE = "#2E7D32"
const ROXO = "#7C4DFF"
const COVID = "#D32F2F"

function Secao({ titulo }: { titulo: string }) {
  return (
    <div className="flex items-center gap-3 mt-10 mb-3">
      <h3 className="font-semibold" style={{ color: "#1A1A1A", fontSize: 18 }}>{titulo}</h3>
      <div className="flex-1 h-px" style={{ background: "#E5E5E5" }} />
    </div>
  )
}

function formatMes(d: string) {
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  const parts = d.split("-")
  if (parts.length >= 2) return `${meses[parseInt(parts[1]) - 1]}/${parts[0].slice(2)}`
  return d
}

interface Props {
  indicadores: any[]
  cagedAlojamento: any
  cagedTotal: any
  empregosAbf: number | null
}

export function TabEmpregos({ indicadores, cagedAlojamento, cagedTotal, empregosAbf }: Props) {
  // ── Série empregos ABF ────────────────────────────────────────────
  const serieEmpregos = useMemo(() => {
    return indicadores
      .filter((r: any) => r.empregos_diretos != null)
      .sort((a: any, b: any) => {
        const aNum = parseInt(a.periodo.match(/(\d{4})/)?.[1] || "0") * 10 + parseInt(a.periodo.match(/(\d)T/)?.[1] || "0")
        const bNum = parseInt(b.periodo.match(/(\d{4})/)?.[1] || "0") * 10 + parseInt(b.periodo.match(/(\d)T/)?.[1] || "0")
        return aNum - bNum
      })
      .map((r: any) => ({
        periodo: r.periodo,
        empregos: r.empregos_diretos,
        empregos_mi: +(r.empregos_diretos / 1_000_000).toFixed(2),
        var_pct: r.var_empregos_pct,
        por_unidade: r.empregos_por_unidade,
      }))
  }, [indicadores])

  const primeiro = serieEmpregos[0]
  const ultimo = serieEmpregos[serieEmpregos.length - 1]
  const crescTotal = primeiro && ultimo ? Math.round(((ultimo.empregos / primeiro.empregos) - 1) * 100) : 0
  const novosEmpregos = primeiro && ultimo ? ultimo.empregos - primeiro.empregos : 0
  const mediaPorTri = serieEmpregos.length > 1 ? Math.round(novosEmpregos / (serieEmpregos.length - 1) / 1000) : 0

  // Série com variação % YoY
  const serieVariacao = useMemo(() => {
    return serieEmpregos.filter((r) => r.var_pct != null).map((r) => ({
      periodo: r.periodo,
      var_pct: r.var_pct,
    }))
  }, [serieEmpregos])

  // Produtividade
  const serieProdutividade = useMemo(() => {
    return serieEmpregos.filter((r) => r.por_unidade != null)
  }, [serieEmpregos])

  // ── CAGED ──────────────────────────────────────────────────────────
  const alojDados = useMemo(() => (cagedAlojamento?.dados || []).sort((a: any, b: any) => a.data.localeCompare(b.data)), [cagedAlojamento])
  const totalDados = useMemo(() => (cagedTotal?.dados || []).sort((a: any, b: any) => a.data.localeCompare(b.data)), [cagedTotal])

  const estoqueAloj = alojDados.length > 0 ? alojDados[alojDados.length - 1]?.estoque || 0 : 0
  const estoqueTotal = totalDados.length > 0 ? totalDados[totalDados.length - 1]?.estoque || 0 : 0
  const alojSaldo12m = alojDados.slice(-12).reduce((acc: number, d: any) => acc + (d.saldo || 0), 0)
  const totalSaldo12m = totalDados.slice(-12).reduce((acc: number, d: any) => acc + (d.saldo || 0), 0)

  const pctFranchisingAloj = empregosAbf && estoqueAloj > 0 ? +((empregosAbf / estoqueAloj) * 100).toFixed(1) : null
  const pctFranchisingTotal = empregosAbf && estoqueTotal > 0 ? +((empregosAbf / estoqueTotal) * 100).toFixed(1) : null

  // Gráfico CAGED mensal comparativo (últimos 24 meses)
  const cagedComparativo = useMemo(() => {
    const meses = new Map<string, { mes: string; alojamento: number; total: number }>()
    for (const d of alojDados.slice(-24)) {
      const mes = d.data.slice(0, 7)
      if (!meses.has(mes)) meses.set(mes, { mes, alojamento: 0, total: 0 })
      meses.get(mes)!.alojamento = d.saldo || 0
    }
    for (const d of totalDados.slice(-24)) {
      const mes = d.data.slice(0, 7)
      if (!meses.has(mes)) meses.set(mes, { mes, alojamento: 0, total: 0 })
      meses.get(mes)!.total = d.saldo || 0
    }
    return [...meses.values()].sort((a, b) => a.mes.localeCompare(b.mes))
  }, [alojDados, totalDados])

  // Tendência de empregos ABF
  const tendencia = serieEmpregos.length >= 3
    ? serieEmpregos[serieEmpregos.length - 1].empregos > serieEmpregos[serieEmpregos.length - 3].empregos ? "crescente" : "estavel"
    : "sem dados"

  return (
    <>
      {/* ═══ PANORAMA ═══ */}
      <Secao titulo="O Franchising Como Empregador" />
      <p className="mb-4" style={{ fontSize: 14, color: "#444", lineHeight: 1.7 }}>
        O franchising e o terceiro maior empregador formal do Brasil, atras apenas do comercio geral e dos servicos. Com quase 1,8 milhao de postos de trabalho diretos e uma media de 9 empregos por unidade, o setor tem impacto social comparavel ao de politicas publicas de emprego.
      </p>

      {/* KPIs de destaque */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {[
          { label: "Empregos diretos", valor: ultimo ? `${ultimo.empregos_mi} mi` : "—", sub: `${ultimo?.periodo || ""}`, cor: P },
          { label: "Novos empregos", valor: `+${Math.round(novosEmpregos / 1000)}k`, sub: `desde ${primeiro?.periodo || "2018"}`, cor: VERDE },
          { label: "Crescimento", valor: `+${crescTotal}%`, sub: `${primeiro?.periodo} → ${ultimo?.periodo}`, cor: VERDE },
          { label: "Media por trimestre", valor: `+${mediaPorTri}k`, sub: "novos postos", cor: "#999" },
        ].map((k) => (
          <div key={k.label} className="p-5" style={CARD}>
            <div className="uppercase tracking-wider font-semibold mb-2" style={{ color: "#999", fontSize: 11 }}>{k.label}</div>
            <div className="font-bold" style={{ color: k.cor, fontSize: 28 }}>{k.valor}</div>
            <div className="mt-1 font-medium" style={{ color: "#999", fontSize: 12 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ═══ SÉRIE HISTÓRICA ═══ */}
      <Secao titulo="Evolucao dos Empregos Diretos" />
      <p className="mb-4" style={{ fontSize: 14, color: "#444", lineHeight: 1.7 }}>
        A serie historica mostra crescimento consistente interrompido apenas em 2020 (-2,6% pela pandemia). A recuperacao foi rapida: em 2022 o setor ja havia superado o patamar pre-pandemia, e desde entao mantem trajetoria {tendencia}.
      </p>
      <InsightBox insights={[
        `De ${h(primeiro?.empregos_mi + " mi")} (${primeiro?.periodo}) para ${h(ultimo?.empregos_mi + " mi")} (${ultimo?.periodo}) — ${h("+" + Math.round(novosEmpregos / 1000) + " mil")} novos postos`,
        `Unico recuo: 2020 com ${h("-2,6%")} (pandemia) — recuperacao completa em 2022 com ${h("+13,8%")}`,
      ]} />
      <div className="p-6" style={CARD}>
        <div className="font-semibold mb-4" style={{ color: "#999", fontSize: 13 }}>
          Empregos diretos no franchising — {primeiro?.periodo} a {ultimo?.periodo}
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={serieEmpregos} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: "#999" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#BBB" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(1)}mi`} />
            <Tooltip formatter={(value) => [`${(Number(value) / 1_000_000).toFixed(2)} mi`, "Empregos diretos"]} contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #eee" }} />
            <Line type="monotone" dataKey="empregos" stroke={P} strokeWidth={2.5} dot={{ r: 5, fill: P, stroke: "#fff", strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
        <GraficoRodape fonte="ABF" periodo={`${primeiro?.periodo}-${ultimo?.periodo}`} />
      </div>

      {/* Variação % YoY */}
      {serieVariacao.length > 0 && (
        <div className="p-6 mt-4" style={CARD}>
          <div className="font-semibold mb-4" style={{ color: "#999", fontSize: 13 }}>
            Variacao % de empregos vs ano anterior
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={serieVariacao} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: "#999" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#BBB" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
              <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, "Variacao"]} contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #eee" }} />
              <Bar dataKey="var_pct" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {serieVariacao.map((e: any, i: number) => (
                  <Cell key={i} fill={e.var_pct >= 0 ? VERDE : COVID} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <GraficoRodape fonte="ABF" periodo={`${serieVariacao[0]?.periodo}-${serieVariacao[serieVariacao.length - 1]?.periodo}`} />
        </div>
      )}

      {/* ═══ FRANCHISING NO EMPREGO FORMAL ═══ */}
      <Secao titulo="Participacao no Emprego Formal Brasileiro" />
      <p className="mb-4" style={{ fontSize: 14, color: "#444", lineHeight: 1.7 }}>
        Com {empregosAbf ? (empregosAbf / 1_000_000).toFixed(2) : "1,80"} milhoes de postos, o franchising representa uma parcela relevante do emprego formal. No setor de alojamento e alimentacao — o mais diretamente ligado a franquias de food service — a participacao e ainda mais expressiva.
      </p>
      <InsightBox insights={[
        ...(pctFranchisingTotal ? [`Franchising = ${h(pctFranchisingTotal + "%")} do emprego formal total do Brasil (${h((estoqueTotal / 1_000_000).toFixed(1) + " mi")} vagas CAGED)`] : []),
        ...(pctFranchisingAloj ? [`Em alojamento e alimentacao: franchising = ${h(pctFranchisingAloj + "%")} do estoque de ${h((estoqueAloj / 1_000_000).toFixed(1) + " mi")} vagas`] : []),
        `Alojamento e alimentacao gerou ${h(Math.round(alojSaldo12m / 1000) + " mil")} vagas nos ultimos 12 meses`,
      ]} />

      {/* Cards de participação */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="p-5 text-center" style={{ ...CARD, borderTop: `3px solid ${P}` }}>
          <div className="uppercase tracking-wider font-semibold mb-2" style={{ color: "#999", fontSize: 10 }}>Emprego total Brasil</div>
          <div className="font-bold" style={{ color: "#1A1A1A", fontSize: 24 }}>{(estoqueTotal / 1_000_000).toFixed(1)} mi</div>
          <div className="font-medium mt-1" style={{ color: "#999", fontSize: 11 }}>vagas formais (CAGED)</div>
          <div className="font-bold mt-2" style={{ color: P, fontSize: 16 }}>{pctFranchisingTotal || "—"}% franchising</div>
        </div>
        <div className="p-5 text-center" style={{ ...CARD, borderTop: `3px solid ${AZUL}` }}>
          <div className="uppercase tracking-wider font-semibold mb-2" style={{ color: "#999", fontSize: 10 }}>Alojamento e alimentacao</div>
          <div className="font-bold" style={{ color: "#1A1A1A", fontSize: 24 }}>{(estoqueAloj / 1_000_000).toFixed(1)} mi</div>
          <div className="font-medium mt-1" style={{ color: "#999", fontSize: 11 }}>vagas formais no setor</div>
          <div className="font-bold mt-2" style={{ color: AZUL, fontSize: 16 }}>{pctFranchisingAloj || "—"}% franchising</div>
        </div>
        <div className="p-5 text-center" style={{ ...CARD, borderTop: `3px solid ${VERDE}` }}>
          <div className="uppercase tracking-wider font-semibold mb-2" style={{ color: "#999", fontSize: 10 }}>Saldo 12 meses</div>
          <div className="font-bold" style={{ color: VERDE, fontSize: 24 }}>{totalSaldo12m > 0 ? "+" : ""}{Math.round(totalSaldo12m / 1000)}k</div>
          <div className="font-medium mt-1" style={{ color: "#999", fontSize: 11 }}>vagas criadas (total CAGED)</div>
          <div className="font-medium mt-2" style={{ color: AZUL, fontSize: 12 }}>Aloj/alim: {alojSaldo12m > 0 ? "+" : ""}{Math.round(alojSaldo12m / 1000)}k</div>
        </div>
      </div>

      {/* Gráfico CAGED comparativo */}
      {cagedComparativo.length > 0 && (
        <div className="p-6" style={CARD}>
          <div className="font-semibold mb-4" style={{ color: "#999", fontSize: 13 }}>
            Saldo mensal CAGED — Total vs Alojamento/Alimentacao (ultimos 24 meses)
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={cagedComparativo} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#BBB" }} tickLine={false} axisLine={false} tickFormatter={formatMes} />
              <YAxis tick={{ fontSize: 10, fill: "#BBB" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value, name) => [`${Number(value).toLocaleString("pt-BR")} vagas`, name === "total" ? "Total Brasil" : "Alojamento/Alim."]}
                labelFormatter={(l) => formatMes(String(l))}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #eee" }}
              />
              <Legend formatter={(v) => (v === "total" ? "Total Brasil" : "Alojamento/Alimentacao")} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="total" fill={P} radius={[2, 2, 0, 0]} maxBarSize={12} opacity={0.3} />
              <Bar dataKey="alojamento" fill={AZUL} radius={[2, 2, 0, 0]} maxBarSize={12} />
            </BarChart>
          </ResponsiveContainer>
          <GraficoRodape fonte="MTE/CAGED via BCB" periodo="ultimos 24 meses" />
        </div>
      )}

      {/* ═══ PRODUTIVIDADE ═══ */}
      {serieProdutividade.length > 0 && (
        <>
          <Secao titulo="Empregos por Unidade Franqueada" />
          <p className="mb-4" style={{ fontSize: 14, color: "#444", lineHeight: 1.7 }}>
            Cada unidade franqueada gera em media entre 8 e 9 empregos diretos. Esse numero subiu de 8,0 em 2019 para 9,0 em 2022 e se mantem estavel desde entao — indicando maturidade operacional do setor.
          </p>
          <InsightBox insights={[
            `Media atual: ${h(ultimo?.por_unidade || 9)} empregos por unidade — com ~202 mil unidades ativas, o setor gera ${h("~1,8 mi")} postos diretos`,
            `A cada 100 novas franquias abertas, cerca de ${h("900 empregos")} formais sao criados`,
          ]} />
          <div className="p-6" style={CARD}>
            <div className="font-semibold mb-4" style={{ color: "#999", fontSize: 13 }}>Empregos por unidade franqueada</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={serieProdutividade} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: "#999" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#BBB" }} tickLine={false} axisLine={false} domain={[6, 12]} />
                <Tooltip formatter={(value) => [value, "Empregos/unidade"]} contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #eee" }} />
                <Line type="monotone" dataKey="por_unidade" stroke={P} strokeWidth={2.5} dot={{ r: 5, fill: P, stroke: "#fff", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
            <GraficoRodape fonte="ABF" periodo={`${serieProdutividade[0]?.periodo}-${serieProdutividade[serieProdutividade.length - 1]?.periodo}`} />
          </div>
        </>
      )}

      {/* ═══ DADOS CONSOLIDADOS 2025 ═══ */}
      <Secao titulo="O Setor em 2025: Consolidado ABF" />
      <p className="mb-4" style={{ fontSize: 14, color: "#444", lineHeight: 1.7 }}>
        Os dados do relatorio anual ABF de marco de 2026 confirmam a expansao organica do setor em todas as dimensoes: mais redes, mais unidades e mais empregos.
      </p>
      <div className="grid grid-cols-3 gap-4 mb-2">
        {[
          { label: "Redes ativas", valor: "3.297", sub: "marcas franqueadoras", var: "+3.1% vs 2024", cor: VERDE },
          { label: "Unidades em operacao", valor: "202.444", sub: "pontos de venda", var: "+2.4% vs 2024", cor: VERDE },
          { label: "Empregos diretos", valor: "1.762 mi", sub: "postos de trabalho", var: "+2.5% vs 2024", cor: VERDE },
        ].map((k) => (
          <div key={k.label} className="p-5" style={CARD}>
            <div className="uppercase tracking-wider font-semibold mb-2" style={{ color: "#999", fontSize: 11 }}>{k.label}</div>
            <div className="font-bold" style={{ color: "#1A1A1A", fontSize: 28 }}>{k.valor}</div>
            <div className="mt-1" style={{ fontSize: 12, color: "#999" }}>{k.sub}</div>
            <div className="mt-1 font-medium" style={{ fontSize: 12, color: k.cor }}>{k.var}</div>
          </div>
        ))}
      </div>

      {/* Conclusão */}
      <div className="p-5 mt-4" style={{ ...CARD, borderLeft: `4px solid ${P}` }}>
        <div className="font-bold mb-2" style={{ fontSize: 16, color: "#1A1A1A" }}>
          O franchising consolida sua posicao como motor de emprego formal no Brasil.
        </div>
        <div style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>
          Com {ultimo?.empregos_mi} milhoes de postos diretos e crescimento de {crescTotal}% em 6 anos, o setor gera mais empregos que muitos programas governamentais. A estabilidade de ~9 empregos por unidade torna o modelo previsivel: cada nova franquia aberta e uma geradora automatica de postos de trabalho formais.
        </div>
        <GraficoRodape fonte="ABF + MTE/CAGED" periodo={`${primeiro?.periodo}-${ultimo?.periodo}`} />
      </div>
    </>
  )
}
