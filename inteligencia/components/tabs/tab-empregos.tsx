"use client"

import { useMemo } from "react"
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  BarChart, Bar,
} from "recharts"
import { InsightBox, h, GraficoRodape } from "@/components/insight-box"

const CARD = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }
const P = "#E8421A"
const AZUL = "#2563EB"

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
  if (parts.length === 2) return `${meses[parseInt(parts[1]) - 1]}/${parts[0].slice(2)}`
  return d
}

interface Props {
  indicadores: any[]
  cagedAlojamento: any
  cagedTotal: any
  empregosAbf: number | null
}

export function TabEmpregos({ indicadores, cagedAlojamento, cagedTotal, empregosAbf }: Props) {
  // Série de empregos diretos
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
        por_unidade: r.empregos_por_unidade,
      }))
  }, [indicadores])

  const primeiro = serieEmpregos[0]
  const ultimo = serieEmpregos[serieEmpregos.length - 1]
  const crescTotal = primeiro && ultimo ? Math.round(((ultimo.empregos / primeiro.empregos) - 1) * 100) : 0
  const novosEmpregos = primeiro && ultimo ? ultimo.empregos - primeiro.empregos : 0

  // Série empregos por unidade
  const serieProdutividade = useMemo(() => {
    return serieEmpregos.filter((r) => r.por_unidade != null).map((r) => ({
      periodo: r.periodo,
      por_unidade: r.por_unidade,
    }))
  }, [serieEmpregos])

  // CAGED alojamento para comparativo
  const alojDados = cagedAlojamento?.dados || []
  const alojSaldo12m = alojDados.slice(-12).reduce((acc: number, d: any) => acc + (d.saldo || 0), 0)
  const estoqueAloj = alojDados.length > 0 ? alojDados[alojDados.length - 1]?.estoque || 0 : 0
  const pctFranchising = empregosAbf && estoqueAloj > 0 ? +((empregosAbf / estoqueAloj) * 100).toFixed(1) : null

  // CAGED mensal para gráfico
  const cagedMensal = useMemo(() => {
    const dados = alojDados.sort((a: any, b: any) => a.data.localeCompare(b.data)).slice(-24)
    return dados.map((d: any) => ({
      mes: d.data.slice(0, 7),
      saldo: d.saldo || 0,
      estoque: d.estoque || 0,
    }))
  }, [alojDados])

  return (
    <>
      {/* ═══ GERAÇÃO DE EMPREGOS ═══ */}
      <Secao titulo="Geracao de Empregos Diretos" />
      <p className="mb-4" style={{ fontSize: 14, color: "#444", lineHeight: 1.7 }}>
        O franchising e um dos maiores empregadores formais do Brasil. A serie historica mostra crescimento consistente, com breve recuo apenas durante a pandemia de 2020.
      </p>
      <InsightBox insights={[
        `O franchising gerou ${h(Math.round(novosEmpregos / 1000) + " mil")} novos empregos nos ultimos 6 anos — de ${h(primeiro?.empregos_mi + " mi")} (${primeiro?.periodo}) para ${h(ultimo?.empregos_mi + " mi")} (${ultimo?.periodo})`,
        `Crescimento de ${h("+" + crescTotal + "%")} no periodo`,
      ]} />
      <div className="p-6" style={CARD}>
        <div className="font-semibold mb-4" style={{ color: "#999", fontSize: 13 }}>
          Empregos diretos no franchising — {primeiro?.periodo} a {ultimo?.periodo}
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={serieEmpregos} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: "#999" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#BBB" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(1)}mi`} />
            <Tooltip formatter={(value) => [`${(Number(value) / 1_000_000).toFixed(2)} mi`, "Empregos"]} contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #eee" }} />
            <Line type="monotone" dataKey="empregos" stroke={P} strokeWidth={2.5} dot={{ r: 5, fill: P, stroke: "#fff", strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
        <GraficoRodape fonte="ABF" periodo={`${primeiro?.periodo}-${ultimo?.periodo}`} />
      </div>

      {/* ═══ EMPREGOS VS MERCADO FORMAL ═══ */}
      <Secao titulo="Franchising no Emprego Formal" />
      <p className="mb-4" style={{ fontSize: 14, color: "#444", lineHeight: 1.7 }}>
        O setor de alojamento e alimentacao no CAGED e o mais diretamente comparavel com franquias de food service. O franchising responde por uma fatia significativa desse emprego formal.
      </p>
      <InsightBox insights={[
        `Alojamento e alimentacao gerou ${h(Math.round(alojSaldo12m / 1000) + " mil")} vagas formais nos ultimos 12 meses (CAGED)`,
        ...(pctFranchising ? [`Franchising representa ${h(pctFranchising + "%")} do estoque de empregos em alojamento e alimentacao`] : []),
      ]} />
      {cagedMensal.length > 0 && (
        <div className="p-6" style={CARD}>
          <div className="font-semibold mb-4" style={{ color: "#999", fontSize: 13 }}>
            Saldo mensal CAGED — Alojamento e Alimentacao (ultimos 24 meses)
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cagedMensal} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#BBB" }} tickLine={false} axisLine={false} tickFormatter={formatMes} />
              <YAxis tick={{ fontSize: 10, fill: "#BBB" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => [`${Number(value).toLocaleString("pt-BR")} vagas`, "Saldo"]} labelFormatter={(l) => formatMes(String(l))} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #eee" }} />
              <Bar dataKey="saldo" radius={[3, 3, 0, 0]} maxBarSize={16} fill={AZUL} />
            </BarChart>
          </ResponsiveContainer>
          <GraficoRodape fonte="MTE/CAGED via BCB" periodo="ultimos 24 meses" />
        </div>
      )}

      {/* ═══ PRODUTIVIDADE POR UNIDADE ═══ */}
      {serieProdutividade.length > 0 && (
        <>
          <Secao titulo="Produtividade: Empregos por Unidade" />
          <p className="mb-4" style={{ fontSize: 14, color: "#444", lineHeight: 1.7 }}>
            Cada unidade franqueada gera em media entre 8 e 9 empregos diretos. Esse numero se mantem estavel ao longo dos anos, indicando que o crescimento de empregos acompanha a abertura de novas unidades.
          </p>
          <InsightBox insights={[
            `Media atual: ${h(ultimo?.por_unidade || 9)} empregos por unidade franqueada`,
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

      {/* ═══ DADOS DO SETOR 2025 ═══ */}
      <Secao titulo="O Setor em 2025: Redes, Unidades e Empregos" />
      <p className="mb-4" style={{ fontSize: 14, color: "#444", lineHeight: 1.7 }}>
        Os dados consolidados do relatorio anual ABF de marco de 2026 mostram um setor em expansao organica, com crescimento em todas as metricas.
      </p>
      <div className="grid grid-cols-3 gap-4 mb-2">
        {[
          { label: "Redes ativas", valor: "3.297", sub: "marcas franqueadoras", var: "+3.1% vs 2024" },
          { label: "Unidades em operacao", valor: "202.444", sub: "pontos de venda", var: "+2.4% vs 2024" },
          { label: "Empregos diretos", valor: "1.762 mi", sub: "postos de trabalho", var: "+2.5% vs 2024" },
        ].map((k) => (
          <div key={k.label} className="p-5" style={CARD}>
            <div className="uppercase tracking-wider font-semibold mb-2" style={{ color: "#999", fontSize: 11 }}>{k.label}</div>
            <div className="font-bold" style={{ color: "#1A1A1A", fontSize: 28 }}>{k.valor}</div>
            <div className="mt-1" style={{ fontSize: 12, color: "#999" }}>{k.sub}</div>
            <div className="mt-1 font-medium" style={{ fontSize: 12, color: "#2E7D32" }}>{k.var}</div>
          </div>
        ))}
      </div>
      <GraficoRodape fonte="ABF — Relatorio Anual" periodo="Mar/2026" nota="Dados do relatorio anual ABF divulgado em marco de 2026" />
    </>
  )
}
