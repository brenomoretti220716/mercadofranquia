"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const CARD_STYLE = { background: "#fff", border: "0.5px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }
const P = "#E8421A"

interface FilaItem {
  id: number
  titulo_gerado: string
  conteudo_gerado: string
  resumo: string
  meta_description: string
  palavra_chave: string
  imagem_prompt: string
  segmento: string
  tags: string
  relevancia: number
  status: string
  fonte_original: string
  url_original: string
  created_at: string
}

interface Stats {
  raw: { total: number; pendente: number }
  fila: { pendente: number; publicado: number; rejeitado: number }
  publicadas: number
}

export default function NoticiasPage() {
  const [tab, setTab] = useState<"fila" | "publicadas" | "fontes" | "instagram">("fila")
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [igPreviewId, setIgPreviewId] = useState<number | null>(null)
  const [fila, setFila] = useState<FilaItem[]>([])
  const [publicadas, setPublicadas] = useState<any[]>([])
  const [igPosts, setIgPosts] = useState<any[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, filaRes, pubRes, igRes] = await Promise.all([
        fetch(`${API_URL}/api/noticias/stats`).then((r) => r.ok ? r.json() : null),
        fetch(`${API_URL}/api/noticias/fila?status=pendente`).then((r) => r.ok ? r.json() : []),
        fetch(`${API_URL}/api/noticias?limit=20`).then((r) => r.ok ? r.json() : { dados: [] }),
        fetch(`${API_URL}/api/instagram/posts`).then((r) => r.ok ? r.json() : []),
      ])
      setStats(statsRes)
      setFila(filaRes)
      setPublicadas(pubRes.dados || [])
      setIgPosts(igRes)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function publicar(id: number) {
    try {
      await fetch(`${API_URL}/api/noticias/publicar/${id}`, { method: "POST" })
      fetchData()
    } catch {}
  }

  async function rejeitar(id: number) {
    try {
      await fetch(`${API_URL}/api/noticias/rejeitar/${id}`, { method: "POST" })
      fetchData()
    } catch {}
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-medium" style={{ color: "#1a1a18" }}>Central de Noticias</h1>
          {stats && stats.fila.pendente > 0 && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: "#FFF0ED", color: P }}>
              {stats.fila.pendente} pendentes
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-6 p-1" style={{ background: "#F0F0F0", borderRadius: 10 }}>
        {[
          { id: "fila" as const, label: `Fila de Revisao${stats ? ` (${stats.fila.pendente})` : ""}` },
          { id: "publicadas" as const, label: `Publicadas${stats ? ` (${stats.publicadas})` : ""}` },
          { id: "instagram" as const, label: `Instagram (${igPosts.length})` },
          { id: "fontes" as const, label: "Fontes" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all"
            style={{ background: tab === t.id ? P : "transparent", color: tab === t.id ? "#fff" : "#666", borderRadius: 8 }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center py-12" style={{ color: "#bbb" }}>Carregando...</p>
      ) : (
        <>
          {/* FILA */}
          {tab === "fila" && (
            <div className="flex flex-col gap-3">
              {fila.length === 0 ? (
                <p className="text-center py-12" style={{ color: "#bbb" }}>Nenhuma noticia pendente</p>
              ) : fila.map((n) => (
                <Card key={n.id} className="border-0 shadow-none" style={CARD_STYLE}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {n.segmento && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FFF0ED", color: P }}>{n.segmento}</span>}
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#F0F0F0", color: "#666" }}>{n.fonte_original}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: n.relevancia >= 7 ? "#E8F5E9" : "#FFF8E1", color: n.relevancia >= 7 ? "#2E7D32" : "#92610E" }}>
                            Relevancia {n.relevancia}/10
                          </span>
                        </div>
                        <h3 className="font-semibold mb-1" style={{ color: "#1A1A1A", fontSize: 15 }}>{n.titulo_gerado}</h3>
                        <p className="mb-2" style={{ fontSize: 13, color: "#666", lineHeight: 1.5 }}>{n.resumo}</p>
                        {n.meta_description && (
                          <div className="mb-2 px-2 py-1" style={{ background: "#F8F8F8", borderRadius: 4, fontSize: 11, color: "#888" }}>
                            META: {n.meta_description}
                          </div>
                        )}
                        {n.palavra_chave && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full mr-1" style={{ background: "#EBF5FF", color: "#2563EB" }}>
                            KW: {n.palavra_chave}
                          </span>
                        )}
                        <button
                          onClick={() => setExpandedId(expandedId === n.id ? null : n.id)}
                          className="text-[11px] font-semibold mt-1" style={{ color: P, background: "none", border: "none", cursor: "pointer" }}
                        >
                          {expandedId === n.id ? "Recolher ↑" : "Ver texto completo ↓"}
                        </button>
                        {expandedId === n.id && (
                          <div className="mt-3 p-3" style={{ background: "#FAFAFA", borderRadius: 8, fontSize: 13, lineHeight: 1.7, color: "#333", maxHeight: 400, overflowY: "auto" }}>
                            <div dangerouslySetInnerHTML={{ __html: n.conteudo_gerado }} />
                            {n.imagem_prompt && (
                              <div className="mt-3 p-2" style={{ background: "#F0F0F0", borderRadius: 4, fontSize: 11, color: "#888" }}>
                                Prompt de imagem: {n.imagem_prompt}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="text-xs mt-1" style={{ color: "#BBB" }}>{n.created_at ? new Date(n.created_at).toLocaleDateString("pt-BR") : ""}</div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button onClick={() => publicar(n.id)} className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg" style={{ background: "#2E7D32" }}>Publicar</button>
                        <button onClick={() => rejeitar(n.id)} className="px-4 py-1.5 text-xs font-semibold rounded-lg" style={{ color: "#D32F2F", border: "1px solid #FFCDD2" }}>Rejeitar</button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* PUBLICADAS */}
          {tab === "publicadas" && (
            <Card className="border-0 shadow-none" style={CARD_STYLE}>
              <CardContent className="p-5">
                {publicadas.length === 0 ? (
                  <p className="text-center py-8" style={{ color: "#bbb" }}>Nenhuma noticia publicada</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {publicadas.map((n: any) => (
                      <div key={n.id} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid #F5F5F5" }}>
                        <div>
                          <span className="font-medium text-sm" style={{ color: "#1A1A1A" }}>{n.titulo}</span>
                          {n.segmento && <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FFF0ED", color: P }}>{n.segmento}</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs" style={{ color: "#999" }}>{n.views || 0} views</span>
                          <span className="text-xs" style={{ color: "#BBB" }}>{n.publicado_em ? new Date(n.publicado_em).toLocaleDateString("pt-BR") : ""}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* INSTAGRAM */}
          {tab === "instagram" && (
            <div className="flex flex-col gap-3">
              {igPosts.length === 0 ? (
                <p className="text-center py-12" style={{ color: "#bbb" }}>Nenhum post gerado. Processe noticias primeiro.</p>
              ) : igPosts.map((p: any) => (
                <Card key={p.id} className="border-0 shadow-none" style={CARD_STYLE}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Card preview mini */}
                      <div
                        className="shrink-0 cursor-pointer"
                        style={{ width: 120, height: 120, borderRadius: 8, overflow: "hidden", background: "#1A1A1A", border: igPreviewId === p.id ? `2px solid ${P}` : "1px solid #333" }}
                        onClick={() => setIgPreviewId(igPreviewId === p.id ? null : p.id)}
                      >
                        <div style={{ transform: "scale(0.111)", transformOrigin: "top left", width: 1080, height: 1080 }} dangerouslySetInnerHTML={{ __html: p.card_html || "" }} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
                            background: p.tipo === "dado_principal" ? "#FFF0ED" : p.tipo === "citacao" ? "#EBF5FF" : p.tipo === "pergunta" ? "#FFF8E1" : "#E8F5E9",
                            color: p.tipo === "dado_principal" ? P : p.tipo === "citacao" ? "#2563EB" : p.tipo === "pergunta" ? "#92610E" : "#2E7D32",
                          }}>{p.tipo}</span>
                          <span className="text-[10px]" style={{ color: "#BBB" }}>{p.noticia_titulo?.slice(0, 40)}...</span>
                        </div>
                        <p className="font-medium mb-1" style={{ fontSize: 13, color: "#1A1A1A" }}>{p.legenda}</p>
                        <p className="text-xs" style={{ color: "#999" }}>{p.hashtags?.slice(0, 80)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: p.status === "aprovado" ? "#E8F5E9" : "#F5F5F5", color: p.status === "aprovado" ? "#2E7D32" : "#999" }}>
                            {p.status}
                          </span>
                          {p.status === "rascunho" && (
                            <button
                              onClick={async () => { await fetch(`${API_URL}/api/instagram/aprovar/${p.id}`, { method: "POST" }); fetchData() }}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded text-white" style={{ background: "#2E7D32" }}
                            >
                              Aprovar
                            </button>
                          )}
                          <a href={`${API_URL}/api/instagram/card/${p.id}`} target="_blank" className="text-[10px] font-semibold" style={{ color: P }}>
                            Ver card →
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Preview expandido */}
                    {igPreviewId === p.id && (
                      <div className="mt-3 p-3" style={{ background: "#0D0D0D", borderRadius: 8, overflow: "auto" }}>
                        <div style={{ width: 540, height: 540, margin: "0 auto" }}>
                          <div style={{ transform: "scale(0.5)", transformOrigin: "top left", width: 1080, height: 1080 }} dangerouslySetInnerHTML={{ __html: p.card_html || "" }} />
                        </div>
                        <div className="mt-2 p-2" style={{ background: "#1A1A1A", borderRadius: 4 }}>
                          <p className="text-xs text-white mb-1">{p.legenda}</p>
                          <p className="text-[10px]" style={{ color: "#666" }}>{p.hashtags}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* FONTES */}
          {tab === "fontes" && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { nome: "ABF Noticias", tipo: "HTML" },
                { nome: "Portal do Franchising", tipo: "HTML" },
                { nome: "Franchise Times", tipo: "RSS" },
                { nome: "Entrepreneur Franchises", tipo: "RSS" },
                { nome: "FranchiseWire", tipo: "RSS" },
              ].map((f) => (
                <Card key={f.nome} className="border-0 shadow-none" style={CARD_STYLE}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm" style={{ color: "#1A1A1A" }}>{f.nome}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#E8F5E9", color: "#2E7D32" }}>{f.tipo}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#999" }}>Coleta automatica a cada 4h</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Stats rodapé */}
          {stats && (
            <div className="mt-6 text-center" style={{ fontSize: 11, color: "#CCC" }}>
              Raw: {stats.raw.total} coletadas ({stats.raw.pendente} pendentes) · Fila: {stats.fila.pendente} pendentes · Publicadas: {stats.publicadas}
            </div>
          )}
        </>
      )}
    </>
  )
}
