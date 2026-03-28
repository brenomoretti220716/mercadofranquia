"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const P = "#E8421A"
const CARD_STYLE = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }

function StatusBadge({ status, lastSync }: { status: string; lastSync: string | null }) {
  const now = Date.now()
  const syncDate = lastSync ? new Date(lastSync).getTime() : 0
  const daysSince = lastSync ? Math.floor((now - syncDate) / 86400000) : 999

  let cor = "#0F6E56"
  let bg = "#E8F5E9"
  let label = "OK"

  if (status === "erro") {
    cor = "#A32D2D"; bg = "#FFEBEE"; label = "ERRO"
  } else if (status === "nunca" || daysSince > 7) {
    cor = "#854F0B"; bg = "#FFF8E1"; label = daysSince > 999 ? "NUNCA" : `${daysSince}d atras`
  }

  return <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: bg, color: cor }}>{label}</span>
}

function SectionHeader({ titulo, icon, total, open, onClick }: { titulo: string; icon: string; total: number; open: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center justify-between w-full p-4 mb-1 transition-all" style={{ ...CARD_STYLE, border: "1px solid #F0F0F0" }}>
      <div className="flex items-center gap-3">
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span className="font-semibold" style={{ fontSize: 15, color: "#1A1A1A" }}>{titulo}</span>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FFF0ED", color: P }}>{total}</span>
      </div>
      <span style={{ color: "#999", fontSize: 12 }}>{open ? "▼" : "▶"}</span>
    </button>
  )
}

interface FontesData {
  macro: any[]
  abf: any[]
  franquias: any[]
  noticias: any[]
}

export default function FontesPage() {
  const [data, setData] = useState<FontesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["macro", "noticias"]))
  const [syncing, setSyncing] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/fontes/status`)
      if (res.ok) setData(await res.json())
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const toggle = (id: string) => {
    setOpenSections((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  async function sync(tipo: string) {
    setSyncing(tipo)
    try {
      await fetch(`${API_URL}/api/fontes/sync/${tipo}`, { method: "POST" })
    } catch {}
    setTimeout(() => { setSyncing(null); fetchData() }, 3000)
  }

  const totalFontes = data ? data.macro.length + data.abf.length + data.franquias.length + data.noticias.length : 0

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-medium" style={{ color: "#1a1a18" }}>Central de Fontes</h1>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: "#FFF0ED", color: P }}>{totalFontes} fontes</span>
        </div>
        <button onClick={fetchData} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ border: "1px solid #E5E5E5", color: "#666" }}>
          Verificar todas
        </button>
      </div>

      {loading ? (
        <p className="text-center py-12" style={{ color: "#bbb" }}>Carregando...</p>
      ) : data && (
        <>
          {/* MACRO BCB/IBGE */}
          <SectionHeader titulo="Dados Macroeconomicos" icon="🏦" total={data.macro.length} open={openSections.has("macro")} onClick={() => toggle("macro")} />
          {openSections.has("macro") && (
            <Card className="border-0 shadow-none mb-4" style={CARD_STYLE}>
              <CardContent className="p-0">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #F0F0F0" }}>
                      <th className="text-left font-semibold py-2 px-4" style={{ color: "#999" }}>Status</th>
                      <th className="text-left font-semibold py-2 px-4" style={{ color: "#999" }}>Fonte</th>
                      <th className="text-right font-semibold py-2 px-4" style={{ color: "#999" }}>Registros</th>
                      <th className="text-left font-semibold py-2 px-4" style={{ color: "#999" }}>Ultimo dado</th>
                      <th className="text-left font-semibold py-2 px-4" style={{ color: "#999" }}>Ultima sync</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.macro.map((f: any) => (
                      <tr key={f.nome} style={{ borderBottom: "1px solid #F8F8F8" }}>
                        <td className="py-2 px-4"><StatusBadge status={f.sync_status} lastSync={f.ultima_sync} /></td>
                        <td className="py-2 px-4 font-medium" style={{ color: "#1A1A1A" }}>{f.nome}</td>
                        <td className="text-right py-2 px-4" style={{ color: "#666" }}>{f.total?.toLocaleString("pt-BR")}</td>
                        <td className="py-2 px-4" style={{ color: "#999" }}>{f.ultimo_registro || "—"}</td>
                        <td className="py-2 px-4" style={{ color: "#999" }}>{f.ultima_sync ? new Date(f.ultima_sync).toLocaleDateString("pt-BR") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-3 text-right" style={{ borderTop: "1px solid #F0F0F0" }}>
                  <button onClick={() => sync("macro")} disabled={syncing === "macro"} className="text-xs font-semibold px-3 py-1.5 rounded text-white" style={{ background: syncing === "macro" ? "#999" : P }}>
                    {syncing === "macro" ? "Sincronizando..." : "Sincronizar agora"}
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* RELATÓRIOS ABF */}
          <SectionHeader titulo="Relatorios ABF" icon="📊" total={data.abf.length} open={openSections.has("abf")} onClick={() => toggle("abf")} />
          {openSections.has("abf") && (
            <Card className="border-0 shadow-none mb-4" style={CARD_STYLE}>
              <CardContent className="p-0">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #F0F0F0" }}>
                      <th className="text-left font-semibold py-2 px-4" style={{ color: "#999" }}>Status</th>
                      <th className="text-left font-semibold py-2 px-4" style={{ color: "#999" }}>Periodo</th>
                      <th className="text-center font-semibold py-2 px-4" style={{ color: "#999" }}>Ano</th>
                      <th className="text-center font-semibold py-2 px-4" style={{ color: "#999" }}>Tri</th>
                      <th className="text-left font-semibold py-2 px-4" style={{ color: "#999" }}>Importado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.abf.map((r: any) => (
                      <tr key={r.periodo} style={{ borderBottom: "1px solid #F8F8F8" }}>
                        <td className="py-2 px-4">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: r.status === "revisado" ? "#E8F5E9" : "#FFF8E1", color: r.status === "revisado" ? "#0F6E56" : "#854F0B" }}>{r.status}</span>
                        </td>
                        <td className="py-2 px-4 font-medium" style={{ color: "#1A1A1A" }}>{r.periodo}</td>
                        <td className="text-center py-2 px-4" style={{ color: "#666" }}>{r.ano}</td>
                        <td className="text-center py-2 px-4" style={{ color: "#666" }}>{r.trimestre || "—"}</td>
                        <td className="py-2 px-4" style={{ color: "#999" }}>{r.created_at ? new Date(r.created_at).toLocaleDateString("pt-BR") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-3 text-right" style={{ borderTop: "1px solid #F0F0F0" }}>
                  <a href="/backoffice/upload" className="text-xs font-semibold px-3 py-1.5 rounded text-white" style={{ background: P }}>Upload novo relatorio</a>
                </div>
              </CardContent>
            </Card>
          )}

          {/* FRANQUIAS */}
          <SectionHeader titulo="Franquias (Scraping)" icon="▣" total={data.franquias.reduce((a: number, f: any) => a + f.total, 0)} open={openSections.has("franquias")} onClick={() => toggle("franquias")} />
          {openSections.has("franquias") && (
            <Card className="border-0 shadow-none mb-4" style={CARD_STYLE}>
              <CardContent className="p-0">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #F0F0F0" }}>
                      <th className="text-left font-semibold py-2 px-4" style={{ color: "#999" }}>Fonte</th>
                      <th className="text-right font-semibold py-2 px-4" style={{ color: "#999" }}>Total</th>
                      <th className="text-left font-semibold py-2 px-4" style={{ color: "#999" }}>Ultima coleta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.franquias.map((f: any) => (
                      <tr key={f.fonte} style={{ borderBottom: "1px solid #F8F8F8" }}>
                        <td className="py-2 px-4 font-medium" style={{ color: "#1A1A1A" }}>{f.fonte}</td>
                        <td className="text-right py-2 px-4 font-semibold" style={{ color: "#1A1A1A" }}>{f.total?.toLocaleString("pt-BR")}</td>
                        <td className="py-2 px-4" style={{ color: "#999" }}>{f.ultima_coleta ? new Date(f.ultima_coleta).toLocaleDateString("pt-BR") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-3 text-right" style={{ borderTop: "1px solid #F0F0F0" }}>
                  <button onClick={() => sync("franquias")} disabled={syncing === "franquias"} className="text-xs font-semibold px-3 py-1.5 rounded text-white" style={{ background: syncing === "franquias" ? "#999" : P }}>
                    {syncing === "franquias" ? "Coletando..." : "Coletar agora"}
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* NOTÍCIAS */}
          <SectionHeader titulo="Noticias (Scraping + RSS)" icon="◆" total={data.noticias.reduce((a: number, f: any) => a + f.total, 0)} open={openSections.has("noticias")} onClick={() => toggle("noticias")} />
          {openSections.has("noticias") && (
            <Card className="border-0 shadow-none mb-4" style={CARD_STYLE}>
              <CardContent className="p-0">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #F0F0F0" }}>
                      <th className="text-left font-semibold py-2 px-4" style={{ color: "#999" }}>Status</th>
                      <th className="text-left font-semibold py-2 px-4" style={{ color: "#999" }}>Fonte</th>
                      <th className="text-center font-semibold py-2 px-4" style={{ color: "#999" }}>Idioma</th>
                      <th className="text-right font-semibold py-2 px-4" style={{ color: "#999" }}>Total</th>
                      <th className="text-right font-semibold py-2 px-4" style={{ color: "#999" }}>Pendentes</th>
                      <th className="text-left font-semibold py-2 px-4" style={{ color: "#999" }}>Ultima coleta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.noticias.map((f: any, i: number) => (
                      <tr key={i} style={{ borderBottom: "1px solid #F8F8F8" }}>
                        <td className="py-2 px-4"><StatusBadge status={f.sync_status} lastSync={f.ultima_coleta} /></td>
                        <td className="py-2 px-4 font-medium" style={{ color: "#1A1A1A", maxWidth: 250 }}>
                          <span className="truncate block">{f.fonte}</span>
                        </td>
                        <td className="text-center py-2 px-4">
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: f.idioma === "pt" ? "#E8F5E9" : "#EBF5FF", color: f.idioma === "pt" ? "#0F6E56" : "#2563EB" }}>{f.idioma?.toUpperCase()}</span>
                        </td>
                        <td className="text-right py-2 px-4" style={{ color: "#666" }}>{f.total}</td>
                        <td className="text-right py-2 px-4">
                          {f.pendentes > 0 ? <span className="font-semibold" style={{ color: P }}>{f.pendentes}</span> : <span style={{ color: "#CCC" }}>0</span>}
                        </td>
                        <td className="py-2 px-4" style={{ color: "#999" }}>{f.ultima_coleta ? new Date(f.ultima_coleta).toLocaleDateString("pt-BR") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-3 flex justify-end gap-2" style={{ borderTop: "1px solid #F0F0F0" }}>
                  <button onClick={() => sync("noticias")} disabled={syncing === "noticias"} className="text-xs font-semibold px-3 py-1.5 rounded text-white" style={{ background: syncing === "noticias" ? "#999" : P }}>
                    {syncing === "noticias" ? "Coletando..." : "Coletar agora"}
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          <p className="text-center mt-6" style={{ fontSize: 11, color: "#CCC" }}>
            Ultima verificacao: {new Date().toLocaleString("pt-BR")}
          </p>
        </>
      )}
    </>
  )
}
