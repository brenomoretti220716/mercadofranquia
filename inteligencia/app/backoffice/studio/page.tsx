"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"

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
  const [tab, setTab] = useState("cards")
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
      const [cRes, carRes] = await Promise.all([
        fetch(`${API_URL}/api/instagram/posts`).then((r) => r.ok ? r.json() : []),
        fetch(`${API_URL}/api/carrosseis`).then((r) => r.ok ? r.json() : []),
      ])
      setCards(cRes)
      setCarrosseis(carRes)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function gerarCarrossel(tipo: string) {
    setGerando(true)
    try { await fetch(`${API_URL}/api/carrosseis/gerar?tipo=${tipo}`, { method: "POST" }); await fetchData() } catch {}
    setGerando(false)
  }

  async function selectCarrossel(id: number) {
    setSelectedCarrossel(id); setSelectedSlide(0)
    try { const r = await fetch(`${API_URL}/api/carrosseis/${id}`); if (r.ok) { const d = await r.json(); setSlides(d.slides || []) } } catch {}
  }

  async function cardAction(id: number, act: string) {
    await fetch(`${API_URL}/api/studio/cards/${id}/${act}`, { method: "POST" }); fetchData()
  }
  async function carrosselAction(id: number, act: string) {
    await fetch(`${API_URL}/api/studio/carrosseis/${id}/${act}`, { method: "POST" }); fetchData()
  }

  const cardsRevisao = cards.filter((c: any) => c.status !== "aprovado")
  const cardsAprovados = cards.filter((c: any) => c.status === "aprovado")
  const carrosseisAprovados = carrosseis.filter((c: any) => c.status === "aprovado")
  const totalAprovados = cardsAprovados.length + carrosseisAprovados.length

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-medium" style={{ color: "#1a1a18" }}>Studio Social</h1>
          {cardsRevisao.length > 0 && <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: "#FFF8E1", color: "#854F0B" }}>{cardsRevisao.length} cards</span>}
          {totalAprovados > 0 && <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: "#E8F5E9", color: "#2E7D32" }}>{totalAprovados} aprovados</span>}
        </div>
      </div>

      <div className="flex gap-1.5 mb-6 p-1" style={{ background: "#F0F0F0", borderRadius: 10 }}>
        {[
          { id: "cards", label: `Cards (${cards.length})` },
          { id: "carrosseis", label: `Carrosseis (${carrosseis.length})` },
          { id: "aprovados", label: `Aprovados (${totalAprovados})` },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all"
            style={{ background: tab === t.id ? P : "transparent", color: tab === t.id ? "#fff" : "#666", borderRadius: 8 }}>{t.label}</button>
        ))}
      </div>

      {loading ? <p className="text-center py-12" style={{ color: "#bbb" }}>Carregando...</p> : (
        <>
          {tab === "cards" && (
            <div className="grid grid-cols-2 gap-4">
              {cards.map((p: any) => (
                <div key={p.id} className="p-4" style={CS}>
                  <div className="flex gap-4">
                    <div style={{ width: 200, height: 200, borderRadius: 8, overflow: "hidden", background: "#1A1A1A", flexShrink: 0 }}>
                      <div style={{ transform: "scale(0.185)", transformOrigin: "top left", width: 1080, height: 1080 }} dangerouslySetInnerHTML={{ __html: p.card_html || "" }} />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FFF0ED", color: P }}>{p.tipo}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: p.status === "aprovado" ? "#E8F5E9" : "#F5F5F5", color: p.status === "aprovado" ? "#2E7D32" : "#999" }}>{p.status}</span>
                        </div>
                        <p className="font-medium mb-1" style={{ fontSize: 13, color: "#1A1A1A" }}>{p.legenda}</p>
                        <p className="text-[10px]" style={{ color: "#999" }}>{p.hashtags?.slice(0, 60)}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        {p.status !== "aprovado" && (
                          <>
                            <button onClick={() => cardAction(p.id, "aprovar")} className="px-3 py-1 text-[10px] font-semibold text-white rounded" style={{ background: "#2E7D32" }}>Aprovar</button>
                            <button onClick={() => cardAction(p.id, "rejeitar")} className="px-3 py-1 text-[10px] font-semibold rounded" style={{ color: "#D32F2F", border: "1px solid #FFCDD2" }}>Rejeitar</button>
                          </>
                        )}
                        <a href={`${API_URL}/api/instagram/card/${p.id}`} target="_blank" className="text-[10px] font-semibold" style={{ color: P }}>Full size →</a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {cards.length === 0 && <p className="col-span-2 text-center py-12" style={{ color: "#bbb" }}>Nenhum card</p>}
            </div>
          )}

          {tab === "carrosseis" && (
            <>
              <div className="grid grid-cols-5 gap-2 mb-5">
                {TIPOS_CARROSSEL.map((t) => (
                  <button key={t.id} onClick={() => gerarCarrossel(t.id)} disabled={gerando} className="p-3 text-center transition-all" style={{ ...CS, border: "1px solid #E5E5E5", opacity: gerando ? 0.5 : 1 }}>
                    <span style={{ fontSize: 20 }}>{t.icon}</span>
                    <div className="font-semibold mt-1" style={{ fontSize: 10, color: "#1A1A1A" }}>{t.label}</div>
                  </button>
                ))}
              </div>
              {gerando && <p className="text-center mb-3 font-semibold" style={{ color: P, fontSize: 12 }}>Gerando...</p>}

              {carrosseis.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-3 mb-2 cursor-pointer" style={{ ...CS, border: selectedCarrossel === c.id ? `2px solid ${P}` : "1px solid #F0F0F0" }} onClick={() => selectCarrossel(c.id)}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FFF0ED", color: P }}>{c.tipo}</span>
                    <span className="font-medium text-sm" style={{ color: "#1A1A1A" }}>{c.titulo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px]" style={{ color: c.status === "aprovado" ? "#2E7D32" : "#999" }}>{c.status}</span>
                    {c.status !== "aprovado" && (
                      <button onClick={(e) => { e.stopPropagation(); carrosselAction(c.id, "aprovar") }} className="px-2 py-0.5 text-[10px] font-semibold text-white rounded" style={{ background: "#2E7D32" }}>Aprovar</button>
                    )}
                  </div>
                </div>
              ))}

              {selectedCarrossel && slides.length > 0 && (
                <Card className="border-0 shadow-none mt-3" style={CS}>
                  <CardContent className="p-4">
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
                    <div className="mt-2 text-center text-xs" style={{ color: "#999" }}>Slide {selectedSlide + 1}/{slides.length}</div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {tab === "aprovados" && (
            <div className="flex flex-col gap-2">
              {totalAprovados === 0 && <p className="text-center py-12" style={{ color: "#bbb" }}>Nenhum aprovado</p>}
              {cardsAprovados.map((p: any) => (
                <div key={`card-${p.id}`} className="flex items-center justify-between p-3" style={{ ...CS, border: "1px solid #F0F0F0" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "#FFF0ED", color: P }}>Card</span>
                    <span className="font-medium text-sm" style={{ color: "#1A1A1A" }}>{p.legenda?.slice(0, 60)}</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: "#E8F5E9", color: "#2E7D32" }}>aprovado</span>
                </div>
              ))}
              {carrosseisAprovados.map((c: any) => (
                <div key={`car-${c.id}`} className="flex items-center justify-between p-3" style={{ ...CS, border: "1px solid #F0F0F0" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "#EBF5FF", color: "#2563EB" }}>Carrossel</span>
                    <span className="font-medium text-sm" style={{ color: "#1A1A1A" }}>{c.titulo}</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: "#E8F5E9", color: "#2E7D32" }}>aprovado</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
