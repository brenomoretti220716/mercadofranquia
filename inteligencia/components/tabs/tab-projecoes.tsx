"use client"

import { useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InsightBox, h, GraficoRodape } from "@/components/insight-box"

const CARD = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }
const P = "#E8421A"

interface Projecao {
  ano_referencia: number
  fat_var_min_pct: number
  fat_var_max_pct: number
  fat_realizado_pct: number | null
}

function badgeProjecao(p: Projecao) {
  if (p.fat_realizado_pct == null) return { label: "Pendente", bg: "#F5F5F5", color: "#999" }
  const superou = p.fat_realizado_pct > p.fat_var_max_pct
  const noAlvo = !superou && p.fat_realizado_pct >= p.fat_var_min_pct
  if (superou) return { label: "Superou", bg: "#E8F5E9", color: "#2E7D32" }
  if (noAlvo) return { label: "No alvo", bg: "#FFF0ED", color: P }
  return { label: "Abaixo", bg: "#FFEBEE", color: "#C62828" }
}

function Secao({ titulo }: { titulo: string }) {
  return (
    <div className="flex items-center gap-3 mt-10 mb-3">
      <h3 className="font-semibold" style={{ color: "#1A1A1A", fontSize: 18 }}>{titulo}</h3>
      <div className="flex-1 h-px" style={{ background: "#E5E5E5" }} />
    </div>
  )
}

export function TabProjecoes({ projecoes }: { projecoes: Projecao[] }) {
  const sorted = useMemo(() => [...projecoes].sort((a, b) => a.ano_referencia - b.ano_referencia), [projecoes])
  const comRealizado = sorted.filter((p) => p.fat_realizado_pct != null)
  const maxReal = useMemo(() => Math.max(...comRealizado.map((p) => p.fat_realizado_pct!), 1), [comRealizado])

  const superouCount = comRealizado.filter((p) => p.fat_realizado_pct! > p.fat_var_max_pct).length
  const totalAnos = comRealizado.length
  const proj2026 = sorted.find((p) => p.ano_referencia === 2026)
  const proj2025 = sorted.find((p) => p.ano_referencia === 2025)

  return (
    <>
      {/* ═══ SEÇÃO 1 — HISTÓRICO ═══ */}
      <Secao titulo="Historico ABF: Projecao vs Realizado" />
      <p className="mb-4" style={{ fontSize: 14, color: "#444", lineHeight: 1.7 }}>
        A ABF publica projecoes anuais de crescimento do setor. Comparar com o resultado realizado revela que o franchising consistentemente entrega acima das expectativas — o que aumenta a confianca nas projecoes futuras.
      </p>
      <InsightBox insights={[
        `O setor superou a projecao da ABF em ${h(superouCount)} dos ultimos ${h(totalAnos)} anos`,
        proj2025 && proj2025.fat_realizado_pct != null ? `2025: projecao de +${proj2025.fat_var_min_pct}% a +${proj2025.fat_var_max_pct}% vs realizado de ${h("+" + proj2025.fat_realizado_pct + "%")} — superou novamente` : "",
      ].filter(Boolean)} />

      <div className="p-6 mb-2" style={CARD}>
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold" style={{ color: "#999", fontSize: 13 }}>Projecao ABF vs Resultado Realizado</div>
          <span style={{ fontSize: 11, color: "#BBB" }}>Fonte: ABF 2021-2026</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#E5E5E5] hover:bg-transparent">
              <TableHead className="text-[12px] uppercase text-[#999] font-semibold">Ano</TableHead>
              <TableHead className="text-[12px] uppercase text-[#999] font-semibold text-right">Projecao ABF</TableHead>
              <TableHead className="text-[12px] uppercase text-[#999] font-semibold text-right">Realizado</TableHead>
              <TableHead className="text-[12px] uppercase text-[#999] font-semibold" style={{ width: "30%" }}>Comparacao</TableHead>
              <TableHead className="text-[12px] uppercase text-[#999] font-semibold text-right">Resultado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((p) => {
              const badge = badgeProjecao(p)
              const projText = p.fat_var_min_pct === p.fat_var_max_pct ? `+${p.fat_var_min_pct}%` : `+${p.fat_var_min_pct}% a +${p.fat_var_max_pct}%`
              const realizado = p.fat_realizado_pct != null
              const barProj = (p.fat_var_max_pct / maxReal) * 100
              const barReal = realizado ? (p.fat_realizado_pct! / maxReal) * 100 : 0

              return (
                <TableRow key={p.ano_referencia} className="border-b border-[#F5F5F5] hover:bg-transparent">
                  <TableCell className="font-semibold" style={{ color: "#1A1A1A", fontSize: 14 }}>
                    {p.ano_referencia}
                    {!realizado && <span className="ml-1" style={{ fontSize: 10, color: "#999" }}>(projecao)</span>}
                  </TableCell>
                  <TableCell className="text-right" style={{ color: "#999", fontSize: 13 }}>{projText}</TableCell>
                  <TableCell className="text-right font-semibold" style={{ color: realizado && p.fat_realizado_pct! > p.fat_var_max_pct ? "#2E7D32" : "#1A1A1A", fontSize: 13 }}>
                    {realizado ? `+${p.fat_realizado_pct}%` : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 9, color: "#BBB", width: 20 }}>ABF</span>
                        <div className="flex-1 rounded-full" style={{ height: 5, background: "#F0F0F0" }}>
                          <div className="rounded-full" style={{ height: "100%", width: `${barProj}%`, background: "#2563EB", opacity: 0.5 }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 9, color: "#BBB", width: 20 }}>Real</span>
                        <div className="flex-1 rounded-full" style={{ height: 5, background: "#F0F0F0" }}>
                          <div className="rounded-full" style={{ height: "100%", width: `${barReal}%`, background: realizado ? badge.color : "#DDD" }} />
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

      {/* ═══ SEÇÃO 2 — PROJEÇÃO 2026 ═══ */}
      {proj2026 && (
        <>
          <Secao titulo="Projecao 2026: O Que Esperar?" />
          <p className="mb-4" style={{ fontSize: 14, color: "#444", lineHeight: 1.7 }}>
            A ABF projeta crescimento de +{proj2026.fat_var_min_pct}% a +{proj2026.fat_var_max_pct}% para 2026. Com base no historico de superacao e nos indicadores atuais, analisamos os fatores que sustentam — e os que podem limitar — esse crescimento.
          </p>

          {/* Card de projeção */}
          <div className="p-6 mb-4 text-center" style={{ ...CARD, border: `2px solid ${P}` }}>
            <span className="inline-block font-semibold px-3 py-1 mb-3" style={{ fontSize: 11, background: "#FFF0ED", color: P, borderRadius: 6 }}>
              ABF Oficial — Projecao 2026
            </span>
            <div className="font-bold" style={{ fontSize: 42, color: P }}>
              +{proj2026.fat_var_min_pct}% a +{proj2026.fat_var_max_pct}%
            </div>
            <div style={{ fontSize: 13, color: "#999" }}>
              Crescimento projetado do faturamento do setor
            </div>
            {proj2025 && proj2025.fat_realizado_pct != null && (
              <div className="mt-2" style={{ fontSize: 12, color: "#666" }}>
                Referencia: 2025 realizou +{proj2025.fat_realizado_pct}% (sobre projecao de +{proj2025.fat_var_min_pct}% a +{proj2025.fat_var_max_pct}%)
              </div>
            )}
          </div>

          {/* Fatores favoráveis vs risco */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-5" style={{ background: "#F0FFF4", borderRadius: 12 }}>
              <div className="font-bold mb-3" style={{ fontSize: 14, color: "#2E7D32" }}>Fatores Favoraveis</div>
              <div className="flex flex-col gap-2.5">
                {[
                  `Setor superou projecao em ${superouCount} dos ultimos ${totalAnos} anos`,
                  "Possivel reducao gradual da Selic ao longo do ano",
                  "Isencao IR ate R$ 5k sustenta poder de compra",
                  "Expansao para cidades do interior acelera",
                  "Saude/Beleza e Alimentacao em alta historica",
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span style={{ fontSize: 14, flexShrink: 0 }}>✅</span>
                    <span style={{ fontSize: 13, color: "#1A1A1A" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-5" style={{ background: "#FFFBEB", borderRadius: 12 }}>
              <div className="font-bold mb-3" style={{ fontSize: 14, color: "#92610E" }}>Fatores de Risco</div>
              <div className="flex flex-col gap-2.5">
                {[
                  "Selic ainda elevada encarece financiamento de novos franqueados",
                  "Endividamento das familias em nivel recorde",
                  "Crescimento mais seletivo — foco em qualidade, nao volume",
                  "Inadimplencia pode ter pico no 2T2026",
                  "Cambio pressionado aumenta custos de redes internacionais",
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
                    <span style={{ fontSize: 13, color: "#1A1A1A" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Conclusão */}
          <div className="p-5" style={{ ...CARD, borderLeft: `4px solid ${P}` }}>
            <div className="font-bold mb-2" style={{ fontSize: 16, color: "#1A1A1A" }}>
              O consenso do mercado aponta para mais um ano de crescimento real do franchising.
            </div>
            <div style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>
              A projecao de +{proj2026.fat_var_min_pct}% a +{proj2026.fat_var_max_pct}% e conservadora dado o historico de superacao.
              O principal risco e o custo do credito, que pode limitar a entrada de novos franqueados.
              Para investidores com capital proprio, o cenario permanece atrativo — especialmente em segmentos de saude, beleza e alimentacao.
            </div>
            <GraficoRodape fonte="ABF + analise Mercado Franquia" periodo="Projecao 2026" />
          </div>
        </>
      )}
    </>
  )
}
