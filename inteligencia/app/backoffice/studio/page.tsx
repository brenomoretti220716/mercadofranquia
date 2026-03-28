"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TabsFluxo, StatusBadges } from "@/components/editorial/TabsFluxo"
import { FluxoActions, VersionBadge } from "@/components/editorial/FluxoActions"
import { ModalRefazer } from "@/components/editorial/ModalRefazer"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const P = "#E8421A"
const CS = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }

const TIPOS_CARROSSEL = [
  { id: "educacional", label: "Educacional", icon: "💡" },
  { id: "verdade_mito", label: "Verdade/Mito", icon: "🤔" },
  { id: "ranking", label: "Top 5", icon: "🏆" },
  { id: "noticia_analise", label: "Noticia", icon: "📰" },
  { id: "pratico", label: "Pratico", icon: "✅" },
]

export default function StudioPage() {
  const [tab, setTab] = useState("revisao")
  const [subTab, setSubTab] = useState<"cards" | "carrosseis">("cards")
  const [stats, setStats] = useState<any>({ cards: {}, carrosseis: {} })
  const [cards, setCards] = useState<any[]>([])
  const [carrosseis, setCarrosseis] = useState<any[]>([])
  const [selectedCarrossel, setSelectedCarrossel] = useState<number | null>(null)
  const [slides, setSlides] = useState<any[]>([])
  const [selectedSlide, setSelectedSlide] = useState(0)
  const [refazerId, setRefazerId] = useState<{ id: number; type: "cards" | "carrosseis" } | null>(null)
  const [gerando, setGerando] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [sRes, cRes, carRes] = await Promise.all([
        fetch(`${API_URL}/api/studio/stats`).then((r) => r.ok ? r.json() : { cards: {}, carrosseis: {} }),
        fetch(`${API_URL}/api/studio/cards?status=${tab}`).then((r) => r.ok ? r.json() : []),
        fetch(`${API_URL}/api/studio/carrosseis?status=${tab}`).then((r) => r.ok ? r.json() : []),
      ])
      setStats(sRes); setCards(cRes); setCarrosseis(carRes)
    } catch {}
    setLoading(false)
  }, [tab])

  useEffect(() => { fetchData() }, [fetchData])

  async function cardAction(id: number, act: string) {
    await fetch(`${API_URL}/api/studio/cards/${id}/${act}`, { method: act === "editar" ? "PUT" : "POST" }); fetchData()
  }
  async function carrosselAction(id: number, act: string) {
    await fetch(`${API_URL}/api/studio/carrosseis/${id}/${act}`, { method: "POST" }); fetchData()
  }
  async function gerarCarrossel(tipo: string) {
    setGerando(true)
    try { await fetch(`${API_URL}/api/carrosseis/gerar?tipo=${tipo}`, { method: "POST" }); await fetchData() } catch {}
    setGerando(false)
  }
  async function selectCarrossel(id: number) {
    if (selectedCarrossel === id) { setSelectedCarrossel(null); return }
    setSelectedCarrossel(id); setSelectedSlide(0)
    try { const r = await fetch(`${API_URL}/api/carrosseis/${id}`); if (r.ok) setSlides((await r.json()).slides || []) } catch {}
  }

  const cTotal = (s: string) => (stats.cards?.[s] || 0) + (stats.carrosseis?.[s] || 0)
  const totalStats = { revisao: cTotal("revisao"), aprovado: cTotal("aprovado"), publicado: cTotal("publicado"), rejeitado: cTotal("rejeitado") }

  const TABS = [
    { id: "revisao", label: "Revisao", count: cTotal("revisao"), cor: "#F59E0B" },
    { id: "aprovado", label: "Aprovados", count: cTotal("aprovado"), cor: "#2563EB" },
    { id: "publicado", label: "Publicados", count: cTotal("publicado"), cor: "#2E7D32" },
    { id: "rejeitado", label: "Rejeitados", count: cTotal("rejeitado"), cor: "#999" },
  ]

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-medium" style={{ color: "#1a1a18" }}>Studio Social</h1>
          <StatusBadges stats={totalStats} />
        </div>
      </div>

      <TabsFluxo tabs={TABS} activeTab={tab} onTabChange={setTab} />

      {/* Gerar novo — botões dentro da tab Revisão */}
      {tab === "revisao" && (
        <div className="flex items-center gap-2 mb-4">
          {TIPOS_CARROSSEL.map((t) => (
            <button key={t.id} onClick={() => gerarCarrossel(t.id)} disabled={gerando} className="px-3 py-1.5 text-[10px] font-semibold rounded transition-all" style={{ border: "1px solid #E5E5E5", color: "#666", opacity: gerando ? 0.5 : 1 }}>
              {t.icon} {t.label}
            </button>
          ))}
          {gerando && <span className="text-xs font-semibold" style={{ color: P }}>Gerando...</span>}
        </div>
      )}

      {loading ? <p className="text-center py-12" style={{ color: "#bbb" }}>Carregando...</p> : (
        <>
          {/* Sub tabs */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => setSubTab("cards")} className="px-3 py-1 text-xs font-semibold" style={{ background: subTab === "cards" ? "#1A1A1A" : "#F0F0F0", color: subTab === "cards" ? "#fff" : "#666", borderRadius: 6 }}>Cards ({cards.length})</button>
            <button onClick={() => setSubTab("carrosseis")} className="px-3 py-1 text-xs font-semibold" style={{ background: subTab === "carrosseis" ? "#1A1A1A" : "#F0F0F0", color: subTab === "carrosseis" ? "#fff" : "#666", borderRadius: 6 }}>Carrosseis ({carrosseis.length})</button>
          </div>

          {/* CARDS */}
          {subTab === "cards" && (
            <div className="grid grid-cols-2 gap-4">
              {cards.length === 0 && <p className="col-span-2 text-center py-12" style={{ color: "#bbb" }}>Nenhum card</p>}
              {cards.map((p: any) => (
                <div key={p.id} className="p-4" style={CS}>
                  <div className="flex gap-4">
                    <div style={{ width: 200, height: 200, borderRadius: 8, overflow: "hidden", background: "#1A1A1A", flexShrink: 0 }}>
                      <div style={{ transform: "scale(0.185)", transformOrigin: "top left", width: 1080, height: 1080 }} dangerouslySetInnerHTML={{ __html: p.card_html || "" }} />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FFF0ED", color: P }}>{p.tipo}</span>
                          <VersionBadge versao={p.versao} />
                        </div>
                        <p className="font-medium mb-1" style={{ fontSize: 12, color: "#1A1A1A", lineHeight: 1.4 }}>{p.legenda}</p>
                        <p className="text-[10px]" style={{ color: "#999" }}>{p.hashtags?.slice(0, 50)}</p>
                      </div>
                      <FluxoActions
                        status={tab}
                        onAprovar={() => cardAction(p.id, "aprovar")}
                        onRejeitar={() => cardAction(p.id, "rejeitar")}
                        onPublicar={() => cardAction(p.id, "publicar")}
                        onRefazer={() => setRefazerId({ id: p.id, type: "cards" })}
                        onVoltarRevisao={() => cardAction(p.id, "aprovar")}
                        extra={<a href={`${API_URL}/api/instagram/card/${p.id}`} target="_blank" className="text-[10px] font-semibold" style={{ color: P }}>Full size →</a>}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CARROSSÉIS */}
          {subTab === "carrosseis" && (
            <div className="flex flex-col gap-3">
              {carrosseis.length === 0 && <p className="text-center py-12" style={{ color: "#bbb" }}>Nenhum carrossel</p>}
              {carrosseis.map((c: any) => (
                <div key={c.id} className="p-4" style={CS}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FFF0ED", color: P }}>{c.tipo}</span>
                      <span className="font-medium text-sm" style={{ color: "#1A1A1A" }}>{c.titulo}</span>
                      <VersionBadge versao={c.versao} />
                    </div>
                    <FluxoActions
                      status={tab}
                      onAprovar={() => carrosselAction(c.id, "aprovar")}
                      onRejeitar={() => carrosselAction(c.id, "rejeitar")}
                      onPublicar={() => carrosselAction(c.id, "publicar")}
                      onRefazer={() => setRefazerId({ id: c.id, type: "carrosseis" })}
                      onVoltarRevisao={() => carrosselAction(c.id, "aprovar")}
                    />
                  </div>
                  <button onClick={() => selectCarrossel(c.id)} className="text-[11px] font-semibold" style={{ color: P, background: "none", border: "none" }}>
                    {selectedCarrossel === c.id ? "Recolher ↑" : "Ver slides ↓"}
                  </button>
                  {selectedCarrossel === c.id && slides.length > 0 && (
                    <div className="mt-3">
                      <div className="flex gap-1.5 mb-3 overflow-x-auto">
                        {slides.map((_: any, i: number) => (
                          <button key={i} onClick={() => setSelectedSlide(i)} className="shrink-0" style={{ width: 60, height: 60, borderRadius: 4, overflow: "hidden", background: "#1A1A1A", border: selectedSlide === i ? `2px solid ${P}` : "1px solid #333" }}>
                            <div style={{ transform: "scale(0.055)", transformOrigin: "top left", width: 1080, height: 1080 }} dangerouslySetInnerHTML={{ __html: slides[i]?.html || "" }} />
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-center" style={{ background: "#0D0D0D", borderRadius: 8, padding: 12 }}>
                        <div style={{ width: 380, height: 380, overflow: "hidden" }}>
                          <div style={{ transform: "scale(0.352)", transformOrigin: "top left", width: 1080, height: 1080 }} dangerouslySetInnerHTML={{ __html: slides[selectedSlide]?.html || "" }} />
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        <span className="text-xs" style={{ color: "#999" }}>Slide {selectedSlide + 1}/{slides.length}</span>
                        <a href={`${API_URL}/api/carrosseis/${c.id}/slide/${selectedSlide + 1}`} target="_blank" className="ml-3 text-xs font-semibold" style={{ color: P }}>Full size →</a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <ModalRefazer
        open={refazerId !== null}
        onClose={() => setRefazerId(null)}
        onRefazer={async (instrucao) => {
          if (!refazerId) return
          // For now just log — refazer API will be added when Claude API is connected
          console.log(`Refazer ${refazerId.type}/${refazerId.id}: ${instrucao}`)
        }}
        tipoSelect={refazerId?.type === "carrosseis" ? TIPOS_CARROSSEL : undefined}
      />
    </>
  )
}
