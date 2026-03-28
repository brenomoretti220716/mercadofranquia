"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const P = "#E8421A"
const CS = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }

export default function EditorialPage() {
  const [tab, setTab] = useState<"fila" | "publicadas">("fila")
  const [fila, setFila] = useState<any[]>([])
  const [publicadas, setPublicadas] = useState<any[]>([])
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [filaRes, pubRes] = await Promise.all([
        fetch(`${API_URL}/api/noticias/fila?status=pendente`).then((r) => r.ok ? r.json() : []),
        fetch(`${API_URL}/api/noticias?limit=20`).then((r) => r.ok ? r.json() : { dados: [] }),
      ])
      setFila(filaRes)
      setPublicadas(pubRes.dados || [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function publicar(id: number) {
    await fetch(`${API_URL}/api/noticias/publicar/${id}`, { method: "POST" }); fetchData()
  }
  async function rejeitar(id: number) {
    await fetch(`${API_URL}/api/noticias/rejeitar/${id}`, { method: "POST" }); fetchData()
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-medium" style={{ color: "#1a1a18" }}>Editorial</h1>
          {fila.length > 0 && <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: "#FFF0ED", color: P }}>{fila.length} pendentes</span>}
        </div>
      </div>

      <div className="flex gap-1.5 mb-6 p-1" style={{ background: "#F0F0F0", borderRadius: 10 }}>
        {[
          { id: "fila" as const, label: `Fila de Revisao (${fila.length})` },
          { id: "publicadas" as const, label: `Publicadas (${publicadas.length})` },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all" style={{ background: tab === t.id ? P : "transparent", color: tab === t.id ? "#fff" : "#666", borderRadius: 8 }}>{t.label}</button>
        ))}
      </div>

      {loading ? <p className="text-center py-12" style={{ color: "#bbb" }}>Carregando...</p> : (
        <>
          {tab === "fila" && (
            <div className="flex flex-col gap-3">
              {fila.length === 0 ? <p className="text-center py-12" style={{ color: "#bbb" }}>Nenhuma noticia pendente</p> : fila.map((n: any) => (
                <Card key={n.id} className="border-0 shadow-none" style={CS}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {n.segmento && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FFF0ED", color: P }}>{n.segmento}</span>}
                          {n.fonte_original && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#F0F0F0", color: "#666" }}>{n.fonte_original}</span>}
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: n.relevancia >= 7 ? "#E8F5E9" : "#FFF8E1", color: n.relevancia >= 7 ? "#2E7D32" : "#92610E" }}>Relevancia {n.relevancia}/10</span>
                        </div>
                        <h3 className="font-semibold mb-1" style={{ color: "#1A1A1A", fontSize: 15 }}>{n.titulo_gerado}</h3>
                        <p className="mb-2" style={{ fontSize: 13, color: "#666", lineHeight: 1.5 }}>{n.resumo}</p>
                        {n.meta_description && <div className="mb-2 px-2 py-1" style={{ background: "#F8F8F8", borderRadius: 4, fontSize: 11, color: "#888" }}>META: {n.meta_description}</div>}
                        <button onClick={() => setExpandedId(expandedId === n.id ? null : n.id)} className="text-[11px] font-semibold mt-1" style={{ color: P, background: "none", border: "none", cursor: "pointer" }}>{expandedId === n.id ? "Recolher ↑" : "Ver texto completo ↓"}</button>
                        {expandedId === n.id && (
                          <div className="mt-3 p-3" style={{ background: "#FAFAFA", borderRadius: 8, fontSize: 13, lineHeight: 1.7, color: "#333", maxHeight: 400, overflowY: "auto" }}>
                            <div dangerouslySetInnerHTML={{ __html: n.conteudo_gerado }} />
                          </div>
                        )}
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

          {tab === "publicadas" && (
            <Card className="border-0 shadow-none" style={CS}>
              <CardContent className="p-5">
                {publicadas.length === 0 ? <p className="text-center py-8" style={{ color: "#bbb" }}>Nenhuma publicada</p> : publicadas.map((n: any) => (
                  <div key={n.id} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid #F5F5F5" }}>
                    <div>
                      <span className="font-medium text-sm" style={{ color: "#1A1A1A" }}>{n.titulo}</span>
                      {n.segmento && <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FFF0ED", color: P }}>{n.segmento}</span>}
                    </div>
                    <span className="text-xs" style={{ color: "#BBB" }}>{n.publicado_em ? new Date(n.publicado_em).toLocaleDateString("pt-BR") : ""}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </>
  )
}
