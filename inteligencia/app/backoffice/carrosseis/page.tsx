"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const P = "#E8421A"
const CARD_STYLE = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }

const TIPOS = [
  { id: "educacional", label: "Voce Sabia?", icon: "💡" },
  { id: "verdade_mito", label: "Verdade ou Mito?", icon: "🤔" },
  { id: "ranking", label: "Top 5", icon: "🏆" },
  { id: "noticia_analise", label: "Noticia + Analise", icon: "📰" },
  { id: "pratico", label: "Pratico", icon: "✅" },
]

interface Carrossel {
  id: number
  tipo: string
  titulo: string
  hashtags: string
  status: string
  created_at: string
}

export default function CarrosseisPage() {
  const [carrosseis, setCarrosseis] = useState<Carrossel[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedSlide, setSelectedSlide] = useState(0)
  const [slides, setSlides] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [gerando, setGerando] = useState(false)

  const fetchCarrosseis = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/carrosseis`)
      if (res.ok) setCarrosseis(await res.json())
    } catch {}
  }, [])

  useEffect(() => { fetchCarrosseis() }, [fetchCarrosseis])

  async function gerarNovo(tipo: string) {
    setGerando(true)
    try {
      const res = await fetch(`${API_URL}/api/carrosseis/gerar?tipo=${tipo}`, { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        await fetchCarrosseis()
        selecionarCarrossel(data.id)
      }
    } catch {}
    setGerando(false)
  }

  async function selecionarCarrossel(id: number) {
    setSelectedId(id)
    setSelectedSlide(0)
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/carrosseis/${id}`)
      if (res.ok) {
        const data = await res.json()
        setSlides(data.slides || [])
      }
    } catch {}
    setLoading(false)
  }

  async function aprovar(id: number) {
    await fetch(`${API_URL}/api/carrosseis/${id}/aprovar`, { method: "POST" })
    fetchCarrosseis()
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-medium" style={{ color: "#1a1a18" }}>Gerador de Carrosseis</h1>
        <p className="text-sm mt-1" style={{ color: "#888" }}>Crie carrosseis de 7 slides com IA</p>
      </div>

      {/* Botões de tipo */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {TIPOS.map((t) => (
          <button
            key={t.id}
            onClick={() => gerarNovo(t.id)}
            disabled={gerando}
            className="p-4 text-center transition-all"
            style={{ ...CARD_STYLE, border: "1px solid #E5E5E5", opacity: gerando ? 0.5 : 1, cursor: gerando ? "wait" : "pointer" }}
          >
            <div style={{ fontSize: 28 }}>{t.icon}</div>
            <div className="font-semibold mt-1" style={{ fontSize: 12, color: "#1A1A1A" }}>{t.label}</div>
          </button>
        ))}
      </div>
      {gerando && <p className="text-center mb-4 font-semibold" style={{ color: P, fontSize: 13 }}>Gerando carrossel com IA...</p>}

      {/* Lista de carrosséis */}
      <div className="flex flex-col gap-2 mb-6">
        {carrosseis.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between p-3 cursor-pointer transition-all"
            style={{ ...CARD_STYLE, border: selectedId === c.id ? `2px solid ${P}` : "1px solid #F0F0F0" }}
            onClick={() => selecionarCarrossel(c.id)}
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FFF0ED", color: P }}>{c.tipo}</span>
              <span className="font-medium text-sm" style={{ color: "#1A1A1A" }}>{c.titulo}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: c.status === "aprovado" ? "#E8F5E9" : "#F5F5F5", color: c.status === "aprovado" ? "#2E7D32" : "#999" }}>{c.status}</span>
              {c.status === "rascunho" && (
                <button onClick={(e) => { e.stopPropagation(); aprovar(c.id) }} className="text-[10px] font-semibold px-2 py-0.5 rounded text-white" style={{ background: "#2E7D32" }}>Aprovar</button>
              )}
            </div>
          </div>
        ))}
        {carrosseis.length === 0 && <p className="text-center py-8" style={{ color: "#BBB" }}>Nenhum carrossel gerado. Escolha um tipo acima.</p>}
      </div>

      {/* Preview de slides */}
      {selectedId && slides.length > 0 && (
        <Card className="border-0 shadow-none" style={CARD_STYLE}>
          <CardContent className="p-5">
            {/* Miniaturas */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {slides.map((_: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedSlide(i)}
                  className="shrink-0"
                  style={{ width: 80, height: 80, borderRadius: 8, overflow: "hidden", background: "#1A1A1A", border: selectedSlide === i ? `3px solid ${P}` : "2px solid #333" }}
                >
                  <div style={{ transform: "scale(0.074)", transformOrigin: "top left", width: 1080, height: 1080 }} dangerouslySetInnerHTML={{ __html: slides[i]?.html || "" }} />
                </button>
              ))}
            </div>

            {/* Slide ampliado */}
            <div className="flex justify-center" style={{ background: "#0D0D0D", borderRadius: 12, padding: 20 }}>
              <div style={{ width: 540, height: 540, overflow: "hidden" }}>
                <div style={{ transform: "scale(0.5)", transformOrigin: "top left", width: 1080, height: 1080 }} dangerouslySetInnerHTML={{ __html: slides[selectedSlide]?.html || "" }} />
              </div>
            </div>

            {/* Info do slide */}
            <div className="mt-3 flex items-center justify-between">
              <div>
                <span className="font-semibold" style={{ fontSize: 13, color: "#1A1A1A" }}>Slide {selectedSlide + 1}/{slides.length}</span>
                <span className="ml-2 text-xs" style={{ color: "#999" }}>{slides[selectedSlide]?.titulo_slide}</span>
              </div>
              <a href={`${API_URL}/api/carrosseis/${selectedId}/slide/${selectedSlide + 1}`} target="_blank" className="font-semibold" style={{ fontSize: 12, color: P }}>
                Abrir full size →
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
