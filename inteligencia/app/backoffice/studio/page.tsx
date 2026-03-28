"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const P = "#E8421A"
const CS = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }

const TIPOS_CARROSSEL = [
  { id: "educacional", icon: "💡", label: "Educacional" },
  { id: "verdade_mito", icon: "🤔", label: "Verdade/Mito" },
  { id: "ranking", icon: "🏆", label: "Top 5" },
  { id: "noticia_analise", icon: "📰", label: "Noticia" },
  { id: "pratico", icon: "✅", label: "Pratico" },
]

export default function StudioPage() {
  const [mainTab, setMainTab] = useState("revisao")
  const [subTab, setSubTab] = useState<"cards" | "carrosseis">("cards")
  const [stats, setStats] = useState<any>({ cards: {}, carrosseis: {} })
  const [cards, setCards] = useState<any[]>([])
  const [carrosseis, setCarrosseis] = useState<any[]>([])
  const [selectedCarrossel, setSelectedCarrossel] = useState<number | null>(null)
  const [slides, setSlides] = useState<any[]>([])
  const [selectedSlide, setSelectedSlide] = useState(0)
  const [gerando, setGerando] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const status = mainTab === "gerar" ? "revisao" : mainTab
      const [statsR, cardsR, carR] = await Promise.all([
        fetch(`${API_URL}/api/studio/stats`).then((r) => r.ok ? r.json() : { cards: {}, carrosseis: {} }),
        fetch(`${API_URL}/api/studio/cards?status=${status}`).then((r) => r.ok ? r.json() : []),
        fetch(`${API_URL}/api/studio/carrosseis?status=${status}`).then((r) => r.ok ? r.json() : []),
      ])
      setStats(statsR)
      setCards(cardsR)
      setCarrosseis(carR)
    } catch {}
    setLoading(false)
  }, [mainTab])

  useEffect(() => { fetchData() }, [fetchData])

  async function cardAction(id: number, act: string) {
    await fetch(`${API_URL}/api/studio/cards/${id}/${act}`, { method: act === "editar" ? "PUT" : "POST" })
    fetchData()
  }
  async function carrosselAction(id: number, act: string) {
    await fetch(`${API_URL}/api/studio/carrosseis/${id}/${act}`, { method: "POST" })
    fetchData()
  }
  async function gerarCarrossel(tipo: string) {
    setGerando(true)
    try { await fetch(`${API_URL}/api/carrosseis/gerar?tipo=${tipo}`, { method: "POST" }); await fetchData() } catch {}
    setGerando(false)
  }
  async function selectCarrossel(id: number) {
    setSelectedCarrossel(id); setSelectedSlide(0)
    try { const r = await fetch(`${API_URL}/api/carrosseis/${id}`); if (r.ok) setSlides((await r.json()).slides || []) } catch {}
  }

  const cTotal = (s: string) => (stats.cards?.[s] || 0) + (stats.carrosseis?.[s] || 0)

  const TABS = [
    { id: "revisao", label: "Revisao", count: cTotal("revisao"), cor: "#F59E0B" },
    { id: "aprovado", label: "Aprovados", count: cTotal("aprovado"), cor: "#2563EB" },
    { id: "publicado", label: "Publicados", count: cTotal("publicado"), cor: "#2E7D32" },
    { id: "rejeitado", label: "Rejeitados", count: cTotal("rejeitado"), cor: "#999" },
    { id: "gerar", label: "Gerar Novo", count: 0, cor: P },
  ]

  function ActionButtons({ type, id, status }: { type: "cards" | "carrosseis"; id: number; status: string }) {
    const fn = type === "cards" ? cardAction : carrosselAction
    return (
      <div className="flex items-center gap-1.5 mt-2">
        {status === "revisao" && (
          <>
            <button onClick={() => fn(id, "aprovar")} className="px-2.5 py-1 text-[10px] font-semibold text-white rounded" style={{ background: "#2E7D32" }}>Aprovar</button>
            <button onClick={() => fn(id, "rejeitar")} className="px-2.5 py-1 text-[10px] font-semibold rounded" style={{ color: "#D32F2F", border: "1px solid #FFCDD2" }}>Rejeitar</button>
          </>
        )}
        {status === "aprovado" && (
          <button onClick={() => fn(id, "publicar")} className="px-2.5 py-1 text-[10px] font-semibold text-white rounded" style={{ background: "#2E7D32" }}>Publicar</button>
        )}
        {type === "cards" && (
          <a href={`${API_URL}/api/instagram/card/${id}`} target="_blank" className="text-[10px] font-semibold" style={{ color: P }}>Full size →</a>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-medium" style={{ color: "#1a1a18" }}>Studio Social</h1>
          {cTotal("revisao") > 0 && <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: "#FFF8E1", color: "#854F0B" }}>{cTotal("revisao")} em revisao</span>}
          {cTotal("aprovado") > 0 && <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: "#E8F5E9", color: "#2E7D32" }}>{cTotal("aprovado")} aprovados</span>}
        </div>
      </div>

      {/* Main tabs */}
      <div className="flex gap-1.5 mb-5 p-1" style={{ background: "#F0F0F0", borderRadius: 10 }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setMainTab(t.id)} className="px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all"
            style={{ background: mainTab === t.id ? P : "transparent", color: mainTab === t.id ? "#fff" : "#666", borderRadius: 8 }}>
            {t.label}{t.count > 0 ? ` (${t.count})` : ""}
          </button>
        ))}
      </div>

      {loading ? <p className="text-center py-12" style={{ color: "#bbb" }}>Carregando...</p> : (
        <>
          {/* TAB GERAR NOVO */}
          {mainTab === "gerar" && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3" style={{ fontSize: 15, color: "#1A1A1A" }}>Gerar Carrossel</h3>
                <div className="grid grid-cols-2 gap-2">
                  {TIPOS_CARROSSEL.map((t) => (
                    <button key={t.id} onClick={() => gerarCarrossel(t.id)} disabled={gerando} className="p-4 text-center transition-all" style={{ ...CS, border: "1px solid #E5E5E5", opacity: gerando ? 0.5 : 1 }}>
                      <span style={{ fontSize: 24 }}>{t.icon}</span>
                      <div className="font-semibold mt-1" style={{ fontSize: 11, color: "#1A1A1A" }}>{t.label}</div>
                    </button>
                  ))}
                </div>
                {gerando && <p className="text-center mt-3 font-semibold" style={{ color: P, fontSize: 12 }}>Gerando com IA...</p>}
              </div>
              <div>
                <h3 className="font-semibold mb-3" style={{ fontSize: 15, color: "#1A1A1A" }}>Em breve</h3>
                <p style={{ fontSize: 13, color: "#999" }}>Geracao de cards avulsos por tema customizado</p>
              </div>
            </div>
          )}

          {/* TABS COM CONTEÚDO */}
          {mainTab !== "gerar" && (
            <>
              {/* Sub tabs: Cards | Carrosséis */}
              <div className="flex gap-2 mb-4">
                <button onClick={() => setSubTab("cards")} className="px-3 py-1 text-xs font-semibold" style={{ background: subTab === "cards" ? "#1A1A1A" : "#F0F0F0", color: subTab === "cards" ? "#fff" : "#666", borderRadius: 6 }}>
                  Cards ({cards.length})
                </button>
                <button onClick={() => setSubTab("carrosseis")} className="px-3 py-1 text-xs font-semibold" style={{ background: subTab === "carrosseis" ? "#1A1A1A" : "#F0F0F0", color: subTab === "carrosseis" ? "#fff" : "#666", borderRadius: 6 }}>
                  Carrosseis ({carrosseis.length})
                </button>
              </div>

              {/* CARDS */}
              {subTab === "cards" && (
                <div className="grid grid-cols-2 gap-4">
                  {cards.length === 0 && <p className="col-span-2 text-center py-12" style={{ color: "#bbb" }}>Nenhum card nesta aba</p>}
                  {cards.map((p: any) => (
                    <div key={p.id} className="p-4" style={CS}>
                      <div className="flex gap-4">
                        <div style={{ width: 200, height: 200, borderRadius: 8, overflow: "hidden", background: "#1A1A1A", flexShrink: 0 }}>
                          <div style={{ transform: "scale(0.185)", transformOrigin: "top left", width: 1080, height: 1080 }} dangerouslySetInnerHTML={{ __html: p.card_html || "" }} />
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FFF0ED", color: P }}>{p.tipo}</span>
                              {p.versao > 1 && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "#EBF5FF", color: "#2563EB" }}>v{p.versao}</span>}
                            </div>
                            <p className="font-medium mb-1" style={{ fontSize: 12, color: "#1A1A1A", lineHeight: 1.4 }}>{p.legenda}</p>
                            <p className="text-[10px]" style={{ color: "#999" }}>{p.hashtags?.slice(0, 50)}</p>
                          </div>
                          <ActionButtons type="cards" id={p.id} status={mainTab} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* CARROSSÉIS */}
              {subTab === "carrosseis" && (
                <div className="flex flex-col gap-3">
                  {carrosseis.length === 0 && <p className="text-center py-12" style={{ color: "#bbb" }}>Nenhum carrossel nesta aba</p>}
                  {carrosseis.map((c: any) => (
                    <div key={c.id} className="p-4" style={CS}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FFF0ED", color: P }}>{c.tipo}</span>
                          <span className="font-medium text-sm" style={{ color: "#1A1A1A" }}>{c.titulo}</span>
                          {c.versao > 1 && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "#EBF5FF", color: "#2563EB" }}>v{c.versao}</span>}
                        </div>
                        <ActionButtons type="carrosseis" id={c.id} status={mainTab} />
                      </div>
                      {/* Slides preview on click */}
                      <button onClick={() => selectCarrossel(c.id)} className="text-[11px] font-semibold" style={{ color: P, background: "none", border: "none" }}>
                        {selectedCarrossel === c.id ? "Recolher slides ↑" : "Ver slides ↓"}
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
        </>
      )}
    </>
  )
}
