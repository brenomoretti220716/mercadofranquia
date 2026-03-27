"use client"

import { useState, useMemo, useCallback } from "react"
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  BarChart, Bar, Cell,
} from "recharts"
import { InsightBox, h } from "@/components/insight-box"

const CARD = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }
const CORES: Record<string, string> = {
  "Alimentação": "#E8421A",
  "Alimentação - CD": "#F4845F",
  "Alimentação - FS": "#F7A072",
  "Casa e Construção": "#2196F3",
  "Comunicação/TI": "#7C4DFF",
  "Educação": "#00BCD4",
  "Entretenimento e Lazer": "#FF9800",
  "Hotelaria e Turismo": "#4CAF50",
  "Limpeza e Conservação": "#795548",
  "Moda": "#E91E63",
  "Saúde, Beleza e Bem-Estar": "#9C27B0",
  "Serviços Automotivos": "#607D8B",
  "Serviços e Outros Negócios": "#455A64",
}
const CORES_FALLBACK = ["#E8421A", "#F4845F", "#2196F3", "#7C4DFF", "#00BCD4", "#FF9800", "#4CAF50", "#795548", "#E91E63", "#9C27B0", "#607D8B", "#455A64"]
const COR_PRIMARIA = "#E8421A"
const COR_VAREJO = "#2196F3"
const COR_COVID = "#D32F2F"

const TOP5_DEFAULT = ["Saúde, Beleza e Bem-Estar", "Alimentação - FS", "Serviços e Outros Negócios", "Moda", "Alimentação - CD"]

function corSegmento(nome: string, idx: number) {
  return CORES[nome] || CORES_FALLBACK[idx % CORES_FALLBACK.length]
}

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

/** "4T2018" → "2018", "3T2025" → "2025*", "2023" → "2023" */
function extrairAnoLabel(periodo: string): string {
  if (periodo === "3T2025") return "2025*"
  const m = periodo.match(/(\d{4})/)
  return m ? m[1] : periodo
}

/** Para ordenação numérica */
function extrairAnoNum(periodo: string): number {
  const m = periodo.match(/(\d{4})/)
  return m ? parseInt(m[1]) : 0
}

const COMPARATIVOS = [
  { titulo: "Saude/Beleza vs Farma", codigoPMC: "103155" },
  { titulo: "Moda vs Tecidos", codigoPMC: "90673" },
  { titulo: "Alimentacao vs Hiper", codigoPMC: "90672" },
  { titulo: "Casa vs Moveis/Eletro", codigoPMC: "2759" },
]

interface Props {
  segmentos: any[]
  segmentosAnual: any[]
  pmcData: any
}

export function TabSegmentos({ segmentos, segmentosAnual, pmcData }: Props) {
  const [selectedSeg, setSelectedSeg] = useState<string | null>(null)
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set())
  const [showAll, setShowAll] = useState(false)

  // ── Anos disponíveis (ordenados cronologicamente) ──────────────────

  const anos = useMemo(() => {
    const labels = [...new Set(segmentosAnual.map((r: any) => extrairAnoLabel(r.periodo)))]
    return labels.sort((a, b) => {
      const na = parseInt(a.replace("*", ""))
      const nb = parseInt(b.replace("*", ""))
      return na - nb
    })
  }, [segmentosAnual])

  const segNames = useMemo(() => {
    return [...new Set(segmentosAnual.map((r: any) => r.segmento))].sort()
  }, [segmentosAnual])

  // Quais segmentos mostrar no gráfico de linhas
  const visibleSegs = useMemo(() => {
    if (showAll) return segNames
    return segNames.filter((s) => TOP5_DEFAULT.includes(s))
  }, [segNames, showAll])

  // ── Série para gráfico de linhas ──────────────────────────────────

  const serieEvolucao = useMemo(() => {
    const byAno = new Map<string, Record<string, any>>()
    for (const r of segmentosAnual) {
      const label = extrairAnoLabel(r.periodo)
      if (!byAno.has(label)) byAno.set(label, { ano: label })
      byAno.get(label)![r.segmento] = +(r.valor_mm / 1000).toFixed(1)
    }
    return [...byAno.values()].sort((a, b) => {
      const na = parseInt(a.ano.replace("*", ""))
      const nb = parseInt(b.ano.replace("*", ""))
      return na - nb
    })
  }, [segmentosAnual])

  // ── Tabela heatmap ────────────────────────────────────────────────

  const heatmapData = useMemo(() => {
    const rows = segNames.map((seg) => {
      const row: Record<string, any> = { segmento: seg }
      let firstVal: number | null = null
      let lastCompleteVal: number | null = null
      for (const ano of anos) {
        const item = segmentosAnual.find((r: any) => extrairAnoLabel(r.periodo) === ano && r.segmento === seg)
        const val = item ? +(item.valor_mm / 1000).toFixed(1) : null
        row[ano] = val
        if (val !== null) {
          if (firstVal === null) firstVal = val
          if (!ano.includes("*")) lastCompleteVal = val
        }
      }
      // Variação: último ano completo vs primeiro
      row.variacao = firstVal && lastCompleteVal ? +(((lastCompleteVal / firstVal) - 1) * 100).toFixed(1) : null
      // Maior valor na linha (para destaque)
      const rowVals = anos.map((a) => row[a]).filter((v): v is number => v != null)
      row._max = Math.max(...rowVals, 0)
      return row
    })

    // Linha Total
    const totalRow: Record<string, any> = { segmento: "Total", _isTotal: true }
    for (const ano of anos) {
      const sum = rows.reduce((acc, r) => acc + (r[ano] ?? 0), 0)
      totalRow[ano] = +sum.toFixed(1)
    }
    const firstTotal = anos.find((a) => totalRow[a] > 0) ? totalRow[anos.find((a) => totalRow[a] > 0)!] : null
    const lastCompleteAno = [...anos].reverse().find((a) => !a.includes("*") && totalRow[a] > 0)
    const lastTotal = lastCompleteAno ? totalRow[lastCompleteAno] : null
    totalRow.variacao = firstTotal && lastTotal ? +(((lastTotal / firstTotal) - 1) * 100).toFixed(1) : null
    totalRow._max = 0

    return [...rows, totalRow]
  }, [segNames, anos, segmentosAnual])

  // Heatmap por linha (cada segmento tem sua própria escala)
  function heatColorRow(val: number | null, rowMax: number) {
    if (val === null || rowMax === 0) return "#F8F8F8"
    const ratio = val / rowMax
    // Branco → laranja claro → laranja
    const r = Math.round(255 - (255 - 232) * ratio)
    const g = Math.round(255 - (255 - 66) * ratio * 0.3)
    const b = Math.round(255 - (255 - 26) * ratio * 0.2)
    return `rgb(${r},${g},${b})`
  }

  // ── Detalhe do segmento selecionado ───────────────────────────────

  const detalhe = useMemo(() => {
    if (!selectedSeg) return null
    const items = segmentosAnual
      .filter((r: any) => r.segmento === selectedSeg)
      .sort((a: any, b: any) => extrairAnoNum(a.periodo) - extrairAnoNum(b.periodo))
    if (items.length === 0) return null

    const serie = items.map((r: any) => ({
      ano: extrairAnoLabel(r.periodo),
      valor_bi: +(r.valor_mm / 1000).toFixed(1),
      valor_mm: r.valor_mm,
    }))

    const totaisPorAno = new Map<string, number>()
    for (const r of segmentosAnual) {
      const label = extrairAnoLabel(r.periodo)
      totaisPorAno.set(label, (totaisPorAno.get(label) || 0) + r.valor_mm)
    }

    const comPart = serie.map((s) => ({
      ...s,
      participacao: totaisPorAno.get(s.ano) ? +((s.valor_mm / totaisPorAno.get(s.ano)!) * 100).toFixed(1) : 0,
    }))

    const melhorAno = comPart.reduce((a, b) => a.valor_bi > b.valor_bi ? a : b)
    const piorAno = comPart.reduce((a, b) => a.valor_bi < b.valor_bi ? a : b)
    const crescTotal = serie.length >= 2
      ? +(((serie[serie.length - 1].valor_mm / serie[0].valor_mm) - 1) * 100).toFixed(1)
      : 0

    return { serie: comPart, melhorAno, piorAno, crescTotal }
  }, [selectedSeg, segmentosAnual])

  const handleLegendClick = useCallback((entry: any) => {
    const key = entry.dataKey || entry.value
    setHiddenLines((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }, [])

  function exportCSV() {
    const header = ["Segmento", ...anos, "Var %"].join(",")
    const rows = heatmapData.map((r) =>
      [`"${r.segmento}"`, ...anos.map((a) => r[a] ?? ""), r.variacao ?? ""].join(",")
    )
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "segmentos-abf.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const maxSeg = segmentos[0]?.valor_mm ?? 1
  const pmcDados = pmcData?.dados || []

  // ── Insights calculados ──────────────────────────────────────────
  const segCrescimentos = useMemo(() => {
    return heatmapData
      .filter((r) => !r._isTotal && r.variacao != null)
      .sort((a, b) => (b.variacao ?? 0) - (a.variacao ?? 0))
  }, [heatmapData])
  const maiorCresc = segCrescimentos[0]
  const menorCresc = segCrescimentos[segCrescimentos.length - 1]

  return (
    <>
      {/* 1. EVOLUÇÃO ANO A ANO */}
      <SectionTitle>Evolucao do Faturamento por Segmento</SectionTitle>
      {maiorCresc && menorCresc && (
        <InsightBox insights={[
          `Segmento de maior crescimento: ${h(maiorCresc.segmento)} com ${h("+" + maiorCresc.variacao + "%")} no periodo`,
          `Menor crescimento: ${h(menorCresc.segmento)} (${h((menorCresc.variacao >= 0 ? "+" : "") + menorCresc.variacao + "%")})`,
        ]} />
      )}
      <div className="p-6 mb-4" style={CARD}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#999" }}>
            Faturamento anual por segmento — R$ bilhoes
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-[10px] font-semibold px-3 py-1"
              style={{ border: "1px solid #E5E5E5", borderRadius: 6, color: showAll ? COR_PRIMARIA : "#999" }}
            >
              {showAll ? "Top 5" : "Ver todos"}
            </button>
            <span style={{ fontSize: 10, color: "#BBB" }}>Fonte: ABF 2018-2025</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={serieEvolucao} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis dataKey="ano" tick={{ fontSize: 11, fill: "#666" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#BBB" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}`} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #eee" }}
              formatter={(value, name) => [`R$ ${value} bi`, String(name)]}
              labelFormatter={(label) => {
                const l = String(label)
                return l.includes("*") ? `${l} (acumulado 12m)` : l
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 10, cursor: "pointer" }}
              onClick={handleLegendClick}
              formatter={(value: string) => (
                <span style={{
                  color: hiddenLines.has(value) ? "#DDD" : (CORES[value] || "#999"),
                  textDecoration: hiddenLines.has(value) ? "line-through" : "none",
                }}>
                  {value}
                </span>
              )}
            />
            {visibleSegs.map((seg, i) => (
              <Line
                key={seg}
                type="monotone"
                dataKey={seg}
                stroke={corSegmento(seg, i)}
                strokeWidth={selectedSeg === seg ? 3.5 : 2.5}
                dot={{ r: selectedSeg === seg ? 5 : 3, fill: corSegmento(seg, i), stroke: "#fff", strokeWidth: 2 }}
                hide={hiddenLines.has(seg)}
                connectNulls={false}
                opacity={selectedSeg && selectedSeg !== seg ? 0.25 : 1}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <div className="text-[10px] mt-2 text-center" style={{ color: "#CCC" }}>
          Clique na legenda para mostrar/esconder · * 2025 = acumulado 12 meses ate 3T2025
        </div>
      </div>

      {/* Ranking barras horizontais */}
      <SectionTitle>Ranking de Segmentos</SectionTitle>
      <div className="p-6 mb-4" style={CARD}>
        <div className="flex flex-col gap-2.5">
          {segmentos.map((r: any, i: number) => {
            const isSelected = selectedSeg === r.segmento
            return (
              <button
                key={r.segmento}
                className="flex items-center gap-3 text-left transition-all"
                style={{ opacity: selectedSeg && !isSelected ? 0.4 : 1 }}
                onClick={() => setSelectedSeg(isSelected ? null : r.segmento)}
              >
                <span className="text-right shrink-0 truncate" style={{ fontSize: 11, color: isSelected ? COR_PRIMARIA : "#666", fontWeight: isSelected ? 600 : 400, width: 180 }}>
                  {r.segmento}
                </span>
                <div className="flex-1 rounded-full" style={{ height: 8, background: "#F0F0F0" }}>
                  <div className="rounded-full transition-all" style={{ height: "100%", background: corSegmento(r.segmento, i), width: `${(r.valor_mm / maxSeg) * 100}%` }} />
                </div>
                <span className="shrink-0 font-semibold" style={{ fontSize: 11, color: "#1A1A1A", width: 70, textAlign: "right" }}>
                  R$ {(r.valor_mm / 1000).toFixed(1)} bi
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. DETALHE DO SEGMENTO SELECIONADO */}
      {selectedSeg && detalhe && (
        <>
          <SectionTitle>{selectedSeg} — Detalhe</SectionTitle>
          <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="p-6" style={CARD}>
              <div className="text-[11px] uppercase tracking-wider font-semibold mb-4" style={{ color: "#999" }}>
                Faturamento {selectedSeg} — R$ bilhoes
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={detalhe.serie} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F0F0F0" />
                  <XAxis dataKey="ano" tick={{ fontSize: 10, fill: "#666" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#BBB" }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v) => [`R$ ${v} bi`, "Faturamento"]} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #eee" }} />
                  <Bar dataKey="valor_bi" radius={[4, 4, 0, 0]} maxBarSize={36}>
                    {detalhe.serie.map((e: any) => (
                      <Cell key={e.ano} fill={e.ano.includes("2020") ? COR_COVID : corSegmento(selectedSeg, 0)} opacity={e.ano.includes("*") ? 0.6 : 1} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="p-6 flex flex-col justify-center gap-4" style={CARD}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: "#999" }}>Crescimento total</div>
                  <div className="text-2xl font-bold" style={{ color: detalhe.crescTotal >= 0 ? COR_PRIMARIA : COR_COVID }}>
                    {detalhe.crescTotal >= 0 ? "+" : ""}{detalhe.crescTotal}%
                  </div>
                  <div className="text-[10px]" style={{ color: "#BBB" }}>{detalhe.serie[0]?.ano} → {detalhe.serie[detalhe.serie.length - 1]?.ano}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: "#999" }}>Participacao no setor</div>
                  <div className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>
                    {detalhe.serie[detalhe.serie.length - 1]?.participacao}%
                  </div>
                  <div className="text-[10px]" style={{ color: "#BBB" }}>ultimo periodo</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3" style={{ background: "#F0FFF4", borderRadius: 8 }}>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: "#2E7D32" }}>Melhor ano</div>
                  <div className="text-sm font-bold" style={{ color: "#2E7D32" }}>
                    {detalhe.melhorAno.ano} — R$ {detalhe.melhorAno.valor_bi} bi
                  </div>
                </div>
                <div className="p-3" style={{ background: "#FFF3F0", borderRadius: 8 }}>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: COR_COVID }}>Pior ano</div>
                  <div className="text-sm font-bold" style={{ color: COR_COVID }}>
                    {detalhe.piorAno.ano} — R$ {detalhe.piorAno.valor_bi} bi
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 3. TABELA HEATMAP */}
      <SectionTitle>Comparativo Segmentos x Anos</SectionTitle>
      <div className="p-6 mb-4" style={CARD}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#999" }}>
            Faturamento por segmento e ano — R$ bilhoes
          </div>
          <button onClick={exportCSV} className="text-[10px] font-semibold px-3 py-1" style={{ border: "1px solid #E5E5E5", borderRadius: 6, color: "#999" }}>
            Exportar CSV
          </button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #E5E5E5" }}>
                <th className="text-left font-bold py-2 px-2" style={{ color: "#666", width: 180, position: "sticky", left: 0, background: "#fff" }}>Segmento</th>
                {anos.map((a) => (
                  <th key={a} className="text-right font-bold py-2 px-2" style={{ color: a.includes("*") ? COR_PRIMARIA : "#666", minWidth: 60 }}>
                    {a}
                  </th>
                ))}
                <th className="text-right font-bold py-2 px-2" style={{ color: "#666", minWidth: 65 }}>Var %</th>
              </tr>
            </thead>
            <tbody>
              {heatmapData.map((row) => {
                const isTotal = row._isTotal
                const isSelected = selectedSeg === row.segmento
                return (
                  <tr
                    key={row.segmento}
                    className={isTotal ? "" : "cursor-pointer"}
                    style={{
                      borderBottom: isTotal ? "2px solid #E5E5E5" : "1px solid #F5F5F5",
                      background: isSelected ? "#FFF8F5" : "transparent",
                      fontWeight: isTotal ? 700 : 400,
                    }}
                    onClick={() => !isTotal && setSelectedSeg(isSelected ? null : row.segmento)}
                  >
                    <td className="py-2 px-2" style={{ color: isSelected ? COR_PRIMARIA : "#1A1A1A", fontWeight: isTotal || isSelected ? 700 : 500, position: "sticky", left: 0, background: isSelected ? "#FFF8F5" : "#fff" }}>
                      {row.segmento}
                    </td>
                    {anos.map((a) => {
                      const val = row[a]
                      const isMax = val != null && val === row._max && !isTotal
                      return (
                        <td
                          key={a}
                          className="text-right py-1.5 px-2"
                          style={{
                            color: isMax ? "#fff" : val != null ? "#1A1A1A" : "#DDD",
                            background: isMax ? COR_PRIMARIA : isTotal ? "transparent" : heatColorRow(val, row._max),
                            borderRadius: isMax ? 4 : 0,
                            fontWeight: isMax || isTotal ? 700 : 500,
                          }}
                        >
                          {val != null ? val.toFixed(1) : "—"}
                        </td>
                      )
                    })}
                    <td className="text-right py-2 px-2 font-bold" style={{ color: row.variacao != null && row.variacao >= 0 ? "#2E7D32" : COR_COVID }}>
                      {row.variacao != null ? `${row.variacao > 0 ? "+" : ""}${row.variacao}%` : "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="text-right mt-2" style={{ fontSize: 10, color: "#BBB" }}>
          Fonte: ABF 2018-2025 · * 2025 = acumulado 12m ate 3T2025 · Destaque = maior valor do segmento
        </div>
      </div>

      {/* 4. COMPARATIVO PMC */}
      <SectionTitle>Franchising vs Varejo Geral (PMC)</SectionTitle>
      <div className="grid grid-cols-4 gap-3">
        {COMPARATIVOS.map((comp) => {
          const pmcFilt = pmcDados.filter((d: any) => d.codigo_segmento === comp.codigoPMC && d.variacao_mensal != null)
            .sort((a: any, b: any) => a.data.localeCompare(b.data))
            .map((d: any) => ({ mes: d.data, pmc: d.variacao_mensal }))
          const ultimoPMC = pmcFilt[pmcFilt.length - 1]?.pmc ?? 0
          const step = Math.max(1, Math.floor(pmcFilt.length / 5))
          return (
            <div key={comp.codigoPMC} className="p-4" style={CARD}>
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "#999" }}>{comp.titulo}</div>
              <div className="text-xs font-semibold mb-2" style={{ color: COR_VAREJO }}>
                Varejo {ultimoPMC > 0 ? "+" : ""}{ultimoPMC.toFixed(1)}%
              </div>
              <ResponsiveContainer width="100%" height={90}>
                <LineChart data={pmcFilt} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="mes" tick={{ fontSize: 9, fill: "#ccc" }} tickLine={false} axisLine={false} tickFormatter={formatMes} interval={step} />
                  <YAxis tick={{ fontSize: 9, fill: "#ccc" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                  <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`, "PMC"]} labelFormatter={(l) => formatMes(String(l))} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #eee" }} />
                  <Line type="monotone" dataKey="pmc" stroke={COR_VAREJO} strokeWidth={1.5} strokeDasharray="6 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div className="text-right" style={{ fontSize: 9, color: "#CCC" }}>IBGE/PMC</div>
            </div>
          )
        })}
      </div>
    </>
  )
}
