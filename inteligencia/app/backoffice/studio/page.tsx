"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const P = "#E8421A"
const CS = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }

const TIPOS_CARROSSEL = [
  { id: "educacional", label: "Voce Sabia?", icon: "💡" },
  { id: "verdade_mito", label: "Verdade ou Mito?", icon: "🤔" },
  { id: "ranking", label: "Top 5", icon: "🏆" },
  { id: "noticia_analise", label: "Noticia", icon: "📰" },
  { id: "pratico", label: "Pratico", icon: "✅" },
]

export default function StudioPage() {
  const [tab, setTab] = useState<"cards" | "carrosseis" | "aprovados">("cards")
  const [igPosts, setIgPosts] = useState<any[]>([])
  const [carrosseis, setCarrosseis] = useState<any[]>([])
  const [selectedCarrossel, setSelectedCarrossel] = useState<number | null>(null)
  const [slides, setSlides] = useState<any[]>([])
  const [selectedSlide, setSelectedSlide] = useState(0)
  const [igPreview, setIgPreview] = useState<number | null>(null)
  const [gerando, setGerando] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [igRes, carRes] = await Promise.all([
        fetch(`${API_URL}/api/instagram/posts`).then((r) => r.ok ? r.json() : []),
        fetch(`${API_URL}/api/carrosseis`).then((r) => r.ok ? r.json() : []),
      ])
      setIgPosts(igRes)
      setCarrosseis(carRes)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function gerarCarrossel(tipo: string) {
    setGerando(true)
    try {
      const res = await fetch(`${API_URL}/api/carrosseis/gerar?tipo=${tipo}`, { method: "POST" })
      if (res.ok) { await fetchData() }
    } catch {}
    setGerando(false)
  }

  async function selectCarrossel(id: number) {
    setSelectedCarrossel(id); setSelectedSlide(0)
    try {
      const res = await fetch(`${API_URL}/api/carrosseis/${id}`)
      if (res.ok) { const d = await res.json(); setSlides(d.slides || []) }
    } catch {}
  }

  const aprovados = [...igPosts.filter((p: any) => p.status === "aprovado"), ...carrosseis.filter((c: any) => c.status === "aprovado")]

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-medium" style={{ color: "#1a1a18" }}>Studio Social</h1>
          {aprovados.length > 0 && <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: "#E8F5E9", color: "#2E7D32" }}>{aprovados.length} prontos</span>}
        </div>
      </div>

      <div className="flex gap-1.5 mb-6 p-1" style={{ background: "#F0F0F0", borderRadius: 10 }}>
        {[
          { id: "cards" as const, label: `Cards (${igPosts.length})` },
          { id: "carrosseis" as const, label: `Carrosseis (${carrosseis.length})` },
          { id: "aprovados" as const, label: `Aprovados (${aprovados.length})` },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all" style={{ background: tab === t.id ? P : "transparent", color: tab === t.id ? "#fff" : "#666", borderRadius: 8 }}>{t.label}</button>
        ))}
      </div>

      {loading ? <p className="text-center py-12" style={{ color: "#bbb" }}>Carregando...</p> : (
        <>
          {/* CARDS */}
          {tab === "cards" && (
            <div className="grid grid-cols-4 gap-3">
              {igPosts.map((p: any) => (
                <div key={p.id} className="cursor-pointer" onClick={() => setIgPreview(igPreview === p.id ? null : p.id)}>
                  <div style={{ width: "100%", aspectRatio: "1", borderRadius: 8, overflow: "hidden", background: "#1A1A1A", border: igPreview === p.id ? `2px solid ${P}` : "1px solid #333" }}>
                    <div style={{ transform: "scale(0.25)", transformOrigin: "top left", width: 1080, height: 1080 }} dangerouslySetInnerHTML={{ __html: p.card_html || "" }} />
                  </div>
                  <div className="mt-1">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "#FFF0ED", color: P }}>{p.tipo}</span>
                    <span className="text-[10px] ml-1" style={{ color: p.status === "aprovado" ? "#2E7D32" : "#999" }}>{p.status}</span>
                  </div>
                </div>
              ))}
              {igPosts.length === 0 && <p className="col-span-4 text-center py-12" style={{ color: "#bbb" }}>Nenhum card gerado</p>}
            </div>
          )}

          {/* CARROSSÉIS */}
          {tab === "carrosseis" && (
            <>
              <div className="grid grid-cols-5 gap-3 mb-5">
                {TIPOS_CARROSSEL.map((t) => (
                  <button key={t.id} onClick={() => gerarCarrossel(t.id)} disabled={gerando} className="p-3 text-center transition-all" style={{ ...CS, border: "1px solid #E5E5E5", opacity: gerando ? 0.5 : 1 }}>
                    <div style={{ fontSize: 24 }}>{t.icon}</div>
                    <div className="font-semibold mt-1" style={{ fontSize: 11, color: "#1A1A1A" }}>{t.label}</div>
                  </button>
                ))}
              </div>
              {gerando && <p className="text-center mb-4 font-semibold" style={{ color: P, fontSize: 13 }}>Gerando...</p>}

              <div className="flex flex-col gap-2 mb-4">
                {carrosseis.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between p-3 cursor-pointer" style={{ ...CS, border: selectedCarrossel === c.id ? `2px solid ${P}` : "1px solid #F0F0F0" }} onClick={() => selectCarrossel(c.id)}>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FFF0ED", color: P }}>{c.tipo}</span>
                      <span className="font-medium text-sm" style={{ color: "#1A1A1A" }}>{c.titulo}</span>
                    </div>
                    <span className="text-[10px]" style={{ color: c.status === "aprovado" ? "#2E7D32" : "#999" }}>{c.status}</span>
                  </div>
                ))}
              </div>

              {selectedCarrossel && slides.length > 0 && (
                <Card className="border-0 shadow-none" style={CS}>
                  <CardContent className="p-5">
                    <div className="flex gap-2 mb-4 overflow-x-auto">
                      {slides.map((_: any, i: number) => (
                        <button key={i} onClick={() => setSelectedSlide(i)} className="shrink-0" style={{ width: 70, height: 70, borderRadius: 6, overflow: "hidden", background: "#1A1A1A", border: selectedSlide === i ? `2px solid ${P}` : "1px solid #333" }}>
                          <div style={{ transform: "scale(0.065)", transformOrigin: "top left", width: 1080, height: 1080 }} dangerouslySetInnerHTML={{ __html: slides[i]?.html || "" }} />
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-center" style={{ background: "#0D0D0D", borderRadius: 12, padding: 16 }}>
                      <div style={{ width: 400, height: 400, overflow: "hidden" }}>
                        <div style={{ transform: "scale(0.37)", transformOrigin: "top left", width: 1080, height: 1080 }} dangerouslySetInnerHTML={{ __html: slides[selectedSlide]?.html || "" }} />
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <span className="text-xs" style={{ color: "#999" }}>Slide {selectedSlide + 1}/{slides.length}</span>
                      <a href={`${API_URL}/api/carrosseis/${selectedCarrossel}/slide/${selectedSlide + 1}`} target="_blank" className="ml-3 text-xs font-semibold" style={{ color: P }}>Abrir full size →</a>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* APROVADOS */}
          {tab === "aprovados" && (
            <div className="flex flex-col gap-2">
              {aprovados.length === 0 ? <p className="text-center py-12" style={{ color: "#bbb" }}>Nenhum criativo aprovado</p> : aprovados.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3" style={{ ...CS, border: "1px solid #F0F0F0" }}>
                  <span className="font-medium text-sm" style={{ color: "#1A1A1A" }}>{item.titulo || item.legenda || item.titulo_gerado || "Sem titulo"}</span>
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
