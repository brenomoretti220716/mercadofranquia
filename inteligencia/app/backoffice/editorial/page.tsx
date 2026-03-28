"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TabsFluxo, StatusBadges } from "@/components/editorial/TabsFluxo"
import { FluxoActions, VersionBadge, RelevanceBadge } from "@/components/editorial/FluxoActions"
import { ModalRefazer } from "@/components/editorial/ModalRefazer"
import { FontesBadges } from "@/components/editorial/FontesBadges"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const P = "#E8421A"
const CS = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }

export default function EditorialPage() {
  const [tab, setTab] = useState("revisao")
  const [items, setItems] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState<Record<number, string>>({})
  const [refazerId, setRefazerId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [sRes, iRes] = await Promise.all([
        fetch(`${API_URL}/api/editorial/stats`).then((r) => r.ok ? r.json() : {}),
        fetch(`${API_URL}/api/editorial/fila?status=${tab}`).then((r) => r.ok ? r.json() : []),
      ])
      setStats(sRes); setItems(iRes)
    } catch {}
    setLoading(false)
  }, [tab])

  useEffect(() => { fetchData() }, [fetchData])

  async function action(id: number, act: string, body?: any) {
    await fetch(`${API_URL}/api/editorial/${id}/${act}`, {
      method: act === "editar" ? "PUT" : "POST",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    }); fetchData()
  }

  function parseTitulos(json: string | null): any[] {
    if (!json) return []; try { return JSON.parse(json) } catch { return [] }
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
          <StatusBadges stats={stats} />
        </div>
      </div>

      <TabsFluxo tabs={TABS} activeTab={tab} onTabChange={setTab} />

      {loading ? <p className="text-center py-12" style={{ color: "#bbb" }}>Carregando...</p> : (
        <div className="flex flex-col gap-3">
          {items.length === 0 && <p className="text-center py-12" style={{ color: "#bbb" }}>Nenhum item</p>}

          {items.map((n: any) => {
            const titulos = parseTitulos(n.titulos_sugeridos)
            const currentTitle = editingTitle[n.id] ?? n.titulo_escolhido ?? n.titulo_gerado ?? ""

            return (
              <Card key={n.id} className="border-0 shadow-none" style={CS}>
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    {/* Thumbnail de imagem */}
                    <div className="shrink-0" style={{ width: 120 }}>
                      {n.imagem_url ? (
                        <img src={`${API_URL}${n.imagem_url}`} alt="" style={{ width: 120, height: 68, objectFit: "cover", borderRadius: 6 }} />
                      ) : n.imagem_status === "gerando" ? (
                        <div className="flex items-center justify-center" style={{ width: 120, height: 68, background: "#F5F5F5", borderRadius: 6, fontSize: 11, color: "#999" }}>Gerando...</div>
                      ) : (
                        <button
                          onClick={async () => { await fetch(`${API_URL}/api/imagens/gerar/noticia/${n.id}`, { method: "POST" }); setTimeout(fetchData, 5000) }}
                          className="flex items-center justify-center" style={{ width: 120, height: 68, background: "#F8F8F8", borderRadius: 6, border: "1px dashed #DDD", fontSize: 11, color: "#999", cursor: "pointer" }}
                        >
                          Gerar imagem
                        </button>
                      )}
                    </div>
                    <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {n.segmento && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FFF0ED", color: P }}>{n.segmento}</span>}
                    {n.fonte_original && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#F0F0F0", color: "#666" }}>{n.fonte_original}</span>}
                    <RelevanceBadge score={n.relevancia || 5} />
                    <VersionBadge versao={n.versao} />
                  </div>

                  <h3 className="font-semibold mb-2" style={{ color: "#1A1A1A", fontSize: 16 }}>{currentTitle}</h3>

                  {titulos.length > 0 && tab === "revisao" && (
                    <div className="mb-3">
                      <div className="text-[11px] font-semibold mb-2" style={{ color: "#999" }}>Escolha o titulo:</div>
                      <div className="flex flex-col gap-1.5">
                        {titulos.map((t: any, i: number) => (
                          <button key={i} onClick={() => setEditingTitle({ ...editingTitle, [n.id]: t.titulo })}
                            className="flex items-center gap-2 p-2 text-left transition-all" style={{ borderRadius: 6, border: currentTitle === t.titulo ? `2px solid ${P}` : "1px solid #F0F0F0", background: currentTitle === t.titulo ? "#FFF0ED" : "#FAFAFA" }}>
                            <span style={{ fontSize: 14 }}>{t.tipo === "viral" ? "🔥" : t.tipo === "seo" ? "📈" : "⚖️"}</span>
                            <span className="flex-1 text-xs font-medium" style={{ color: "#1A1A1A" }}>{t.titulo}</span>
                            <span className="text-[10px]" style={{ color: "#999" }}>{t.score}/10</span>
                          </button>
                        ))}
                      </div>
                      <input type="text" value={currentTitle} onChange={(e) => setEditingTitle({ ...editingTitle, [n.id]: e.target.value })}
                        className="w-full mt-2 px-3 py-2 text-sm outline-none" style={{ border: "1px solid #E5E5E5", borderRadius: 6, color: "#1A1A1A" }} />
                    </div>
                  )}

                  <p className="mb-2" style={{ fontSize: 13, color: "#666", lineHeight: 1.5 }}>{n.resumo}</p>

                  <FontesBadges fontesJson={n.fontes_usadas} fonteOriginal={n.fonte_original} />

                  <button onClick={() => setExpandedId(expandedId === n.id ? null : n.id)} className="text-[11px] font-semibold mb-3" style={{ color: P, background: "none", border: "none", cursor: "pointer" }}>
                    {expandedId === n.id ? "Recolher ↑" : "Ver conteudo ↓"}
                  </button>
                  {expandedId === n.id && (
                    <div className="mb-3 p-3" style={{ background: "#FAFAFA", borderRadius: 8, fontSize: 13, lineHeight: 1.7, color: "#333", maxHeight: 400, overflowY: "auto" }}>
                      <div dangerouslySetInnerHTML={{ __html: n.conteudo_gerado || "" }} />
                    </div>
                  )}

                  <FluxoActions
                    status={tab}
                    onAprovar={() => action(n.id, "aprovar", { titulo_escolhido: currentTitle })}
                    onRejeitar={() => action(n.id, "rejeitar")}
                    onPublicar={() => action(n.id, "publicar")}
                    onRefazer={() => setRefazerId(n.id)}
                    onVoltarRevisao={() => action(n.id, "aprovar")}
                  />
                    </div>{/* close flex-1 */}
                  </div>{/* close flex gap-4 */}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <ModalRefazer open={refazerId !== null} onClose={() => setRefazerId(null)} onRefazer={async (instrucao) => {
        if (refazerId) await action(refazerId, "refazer", { instrucao })
      }} />
    </>
  )
}
