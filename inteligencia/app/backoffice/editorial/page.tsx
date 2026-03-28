"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const P = "#E8421A"
const CS = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }

export default function EditorialPage() {
  const [tab, setTab] = useState("revisao")
  const [items, setItems] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, itemsRes] = await Promise.all([
        fetch(`${API_URL}/api/editorial/stats`).then((r) => r.ok ? r.json() : {}),
        fetch(`${API_URL}/api/editorial/fila?status=${tab}`).then((r) => r.ok ? r.json() : []),
      ])
      setStats(statsRes)
      setItems(itemsRes)
    } catch {}
    setLoading(false)
  }, [tab])

  useEffect(() => { fetchData() }, [fetchData])

  async function action(id: number, act: string, body?: any) {
    await fetch(`${API_URL}/api/editorial/${id}/${act}`, {
      method: act === "editar" ? "PUT" : "POST",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    })
    fetchData()
  }

  function parseTitulos(json: string | null): any[] {
    if (!json) return []
    try { return JSON.parse(json) } catch { return [] }
  }

  const TABS = [
    { id: "revisao", label: "Revisao", count: stats.revisao || 0, cor: "#F59E0B" },
    { id: "aprovado", label: "Aprovados", count: stats.aprovado || 0, cor: "#2563EB" },
    { id: "publicado", label: "Publicados", count: stats.publicado || 0, cor: "#2E7D32" },
    { id: "rejeitado", label: "Rejeitados", count: stats.rejeitado || 0, cor: "#999" },
  ]

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-medium" style={{ color: "#1a1a18" }}>Editorial</h1>
          {(stats.revisao || 0) > 0 && <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: "#FFF8E1", color: "#854F0B" }}>{stats.revisao} em revisao</span>}
          {(stats.aprovado || 0) > 0 && <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: "#EBF5FF", color: "#2563EB" }}>{stats.aprovado} aprovados</span>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-6 p-1" style={{ background: "#F0F0F0", borderRadius: 10 }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all"
            style={{ background: tab === t.id ? P : "transparent", color: tab === t.id ? "#fff" : "#666", borderRadius: 8 }}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {loading ? <p className="text-center py-12" style={{ color: "#bbb" }}>Carregando...</p> : (
        <div className="flex flex-col gap-3">
          {items.length === 0 && <p className="text-center py-12" style={{ color: "#bbb" }}>Nenhum item nesta aba</p>}

          {items.map((n: any) => {
            const titulos = parseTitulos(n.titulos_sugeridos)
            const currentTitle = editingTitle[n.id] ?? n.titulo_escolhido ?? n.titulo_gerado ?? ""

            return (
              <Card key={n.id} className="border-0 shadow-none" style={CS}>
                <CardContent className="p-5">
                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {n.segmento && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FFF0ED", color: P }}>{n.segmento}</span>}
                    {n.fonte_original && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#F0F0F0", color: "#666" }}>{n.fonte_original}</span>}
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: n.relevancia >= 8 ? "#E8F5E9" : n.relevancia >= 6 ? "#FFF8E1" : "#FFEBEE", color: n.relevancia >= 8 ? "#2E7D32" : n.relevancia >= 6 ? "#854F0B" : "#A32D2D" }}>
                      {n.relevancia}/10
                    </span>
                    {n.versao > 1 && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#EBF5FF", color: "#2563EB" }}>v{n.versao}</span>}
                  </div>

                  {/* Título */}
                  <h3 className="font-semibold mb-2" style={{ color: "#1A1A1A", fontSize: 16 }}>{currentTitle}</h3>

                  {/* Títulos sugeridos */}
                  {titulos.length > 0 && tab === "revisao" && (
                    <div className="mb-3">
                      <div className="text-[11px] font-semibold mb-2" style={{ color: "#999" }}>Escolha o titulo:</div>
                      <div className="flex flex-col gap-1.5">
                        {titulos.map((t: any, i: number) => {
                          const icon = t.tipo === "viral" ? "🔥" : t.tipo === "seo" ? "📈" : "⚖️"
                          const selected = currentTitle === t.titulo
                          return (
                            <button key={i} onClick={() => setEditingTitle({ ...editingTitle, [n.id]: t.titulo })}
                              className="flex items-center gap-2 p-2 text-left transition-all" style={{ borderRadius: 6, border: selected ? `2px solid ${P}` : "1px solid #F0F0F0", background: selected ? "#FFF0ED" : "#FAFAFA" }}>
                              <span style={{ fontSize: 14 }}>{icon}</span>
                              <span className="flex-1 text-xs font-medium" style={{ color: "#1A1A1A" }}>{t.titulo}</span>
                              <span className="text-[10px]" style={{ color: "#999" }}>{t.score}/10</span>
                            </button>
                          )
                        })}
                      </div>
                      <input
                        type="text" value={currentTitle}
                        onChange={(e) => setEditingTitle({ ...editingTitle, [n.id]: e.target.value })}
                        className="w-full mt-2 px-3 py-2 text-sm outline-none"
                        style={{ border: "1px solid #E5E5E5", borderRadius: 6, color: "#1A1A1A" }}
                        placeholder="Editar titulo..."
                      />
                    </div>
                  )}

                  {/* Resumo + preview */}
                  <p className="mb-2" style={{ fontSize: 13, color: "#666", lineHeight: 1.5 }}>{n.resumo}</p>
                  {n.meta_description && <div className="mb-2 px-2 py-1" style={{ background: "#F8F8F8", borderRadius: 4, fontSize: 11, color: "#888" }}>META: {n.meta_description}</div>}

                  <button onClick={() => setExpandedId(expandedId === n.id ? null : n.id)} className="text-[11px] font-semibold" style={{ color: P, background: "none", border: "none", cursor: "pointer" }}>
                    {expandedId === n.id ? "Recolher ↑" : "Ver conteudo completo ↓"}
                  </button>
                  {expandedId === n.id && (
                    <div className="mt-3 p-3" style={{ background: "#FAFAFA", borderRadius: 8, fontSize: 13, lineHeight: 1.7, color: "#333", maxHeight: 400, overflowY: "auto" }}>
                      <div dangerouslySetInnerHTML={{ __html: n.conteudo_gerado || "" }} />
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex items-center gap-2 mt-4">
                    {tab === "revisao" && (
                      <>
                        <button onClick={() => action(n.id, "aprovar", { titulo_escolhido: currentTitle })} className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg" style={{ background: "#2E7D32" }}>Aprovar</button>
                        <button onClick={() => action(n.id, "rejeitar")} className="px-3 py-1.5 text-xs font-semibold rounded-lg" style={{ color: "#D32F2F", border: "1px solid #FFCDD2" }}>Rejeitar</button>
                      </>
                    )}
                    {tab === "aprovado" && (
                      <button onClick={() => action(n.id, "publicar")} className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg" style={{ background: "#2E7D32" }}>Publicar</button>
                    )}
                    <span className="text-xs" style={{ color: "#CCC" }}>{n.created_at ? new Date(n.created_at).toLocaleDateString("pt-BR") : ""}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
