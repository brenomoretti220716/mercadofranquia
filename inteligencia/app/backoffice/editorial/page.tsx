"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TabsFluxo, StatusBadges } from "@/components/editorial/TabsFluxo"
import { FluxoActions, VersionBadge, RelevanceBadge } from "@/components/editorial/FluxoActions"
import { ModalRefazerTexto } from "@/components/editorial/ModalRefazerTexto"
import { ModalRefazerImagem } from "@/components/editorial/ModalRefazerImagem"
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
  const [modalTextoId, setModalTextoId] = useState<number | null>(null)
  const [modalImagemId, setModalImagemId] = useState<number | null>(null)
  const [imagemExpandida, setImagemExpandida] = useState<string | null>(null)
  const [copiadoId, setCopiadoId] = useState<number | null>(null)
  const [imagemVersions, setImagemVersions] = useState<Record<number, number>>({})
  const [imagensGerando, setImagensGerando] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [gerandoPipeline, setGerandoPipeline] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [sRes, iRes] = await Promise.all([
        fetch(`${API_URL}/api/editorial/stats`).then((r) => r.ok ? r.json() : {}),
        fetch(`${API_URL}/api/editorial/fila?status=${tab}`).then((r) => r.ok ? r.json() : []),
      ])
      setStats(sRes)
      setItems(iRes)
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

  async function refazerTexto(id: number, instrucao: string) {
    const msg = instrucao || "Reescreva mantendo o mesmo tema, segmento e fontes com abordagem editorial renovada."
    await action(id, "refazer", { instrucao: msg })
  }

  async function refazerImagem(id: number, params: { instrucao: string }) {
    setImagensGerando((prev) => new Set(prev).add(id))
    try {
      await fetch(`${API_URL}/api/imagens/refazer/noticia/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instrucao: params.instrucao || "" }),
      })
      await fetchData()
      // Polling a cada 3s por até 2 minutos até imagem ficar pronta ou erro
      const maxTentativas = 40
      let tentativas = 0
      const poll = setInterval(async () => {
        tentativas++
        const res = await fetch(`${API_URL}/api/editorial/fila?status=${tab}`).then((r) => r.ok ? r.json() : [])
        setItems(res)
        const item = res.find((i: any) => i.id === id)
        if (item?.imagem_status === "gerado" || item?.imagem_status === "erro" || tentativas >= maxTentativas) {
          clearInterval(poll)
          setImagemVersions((prev) => ({ ...prev, [id]: Date.now() }))
          setImagensGerando((prev) => { const s = new Set(prev); s.delete(id); return s })
        }
      }, 3000)
    } catch {
      setImagensGerando((prev) => { const s = new Set(prev); s.delete(id); return s })
    }
  }

  function parseTitulos(json: string | null): any[] {
    if (!json) return []
    try { return JSON.parse(json) } catch { return [] }
  }

  function processarHtmlComGraficos(html: string, apiUrl: string): string {
    return html.replace(
      /<div\s+class="grafico-inline"\s+data-grafico="([^"]+)"[^>]*><\/div>/g,
      (_, url) => `<img src="${apiUrl}${url}" alt="gráfico" style="width:80%;max-width:640px;display:block;margin:20px auto;border-radius:8px;" />`
    )
  }

  const TABS = [
    { id: "revisao",   label: "Revisao",    count: stats.revisao  || 0, cor: "#F59E0B" },
    { id: "aprovado",  label: "Aprovados",  count: stats.aprovado || 0, cor: "#2563EB" },
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
        <button
          disabled={gerandoPipeline}
          onClick={async () => {
            setGerandoPipeline(true)
            await fetch(`${API_URL}/api/pipeline/rodar`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ limite: 5 }),
            })
            setTimeout(() => { fetchData(); setGerandoPipeline(false) }, 30000)
          }}
          className="px-4 py-2 text-xs font-semibold text-white rounded-lg"
          style={{ background: gerandoPipeline ? "#999" : P, cursor: gerandoPipeline ? "not-allowed" : "pointer" }}
        >
          {gerandoPipeline ? "Gerando..." : "＋ Gerar notícias"}
        </button>
      </div>

      <TabsFluxo tabs={TABS} activeTab={tab} onTabChange={setTab} />

      {loading ? (
        <p className="text-center py-12" style={{ color: "#bbb" }}>Carregando...</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.length === 0 && (
            <p className="text-center py-12" style={{ color: "#bbb" }}>Nenhum item</p>
          )}

          {items.map((n: any) => {
            const titulos = parseTitulos(n.titulos_sugeridos)
            const currentTitle = editingTitle[n.id] ?? n.titulo_escolhido ?? n.titulo_gerado ?? ""
            const estaGerando = imagensGerando.has(n.id) || n.imagem_status === "gerando"

            return (
              <Card key={n.id} className="border-0 shadow-none" style={CS}>
                <CardContent className="p-5">
                  <div className="flex gap-4">

                    {/* ── Thumbnail ──────────────────────────────────────── */}
                    <div className="shrink-0" style={{ width: 120 }}>
                      {n.imagem_url ? (
                        <div className="relative group" style={{ width: 120, height: 68 }}>
                          <img
                            src={`${API_URL}${n.imagem_url}?v=${imagemVersions[n.id] || n.id}`}
                            alt=""
                            onClick={() => setImagemExpandida(`${API_URL}${n.imagem_url}?v=${imagemVersions[n.id] || n.id}`)}
                            style={{ width: 120, height: 68, objectFit: "cover", borderRadius: 6, cursor: "pointer" }}
                          />
                          {/* Botão download no canto */}
                          <a
                            href={`${API_URL}${n.imagem_url}?v=${imagemVersions[n.id] || n.id}`}
                            download={`noticia_${n.id}.png`}
                            className="absolute opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            style={{ top: 3, right: 3, width: 20, height: 20, background: "rgba(0,0,0,0.6)", borderRadius: 4, fontSize: 10, color: "#fff", textDecoration: "none" }}
                          >
                            ↓
                          </a>
                          {/* Botão refazer imagem sobre a thumbnail */}
                          <button
                            onClick={() => setModalImagemId(n.id)}
                            className="absolute opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            style={{ bottom: 3, left: 3, right: 3, height: 22, background: "rgba(0,0,0,0.6)", borderRadius: 4, fontSize: 10, color: "#fff", fontWeight: 600, border: "none", cursor: "pointer" }}
                          >
                            ↺ Imagem
                          </button>
                        </div>
                      ) : estaGerando ? (
                        <div
                          className="flex items-center justify-center"
                          style={{ width: 120, height: 68, background: "#F5F5F5", borderRadius: 6, fontSize: 11, color: "#999" }}
                        >
                          Buscando no Pexels...
                        </div>
                      ) : (
                        <button
                          onClick={() => setModalImagemId(n.id)}
                          className="flex items-center justify-center"
                          style={{ width: 120, height: 68, background: "#F8F8F8", borderRadius: 6, border: "1px dashed #DDD", fontSize: 11, color: "#999", cursor: "pointer" }}
                        >
                          Gerar imagem
                        </button>
                      )}
                    </div>

                    {/* ── Conteúdo ───────────────────────────────────────── */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {n.segmento && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FFF0ED", color: P }}>
                            {n.segmento}
                          </span>
                        )}
                        {n.fonte_original && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#F0F0F0", color: "#666" }}>
                            {n.fonte_original}
                          </span>
                        )}
                        <RelevanceBadge score={n.relevancia || 5} />
                        <VersionBadge versao={n.versao} />
                      </div>

                      <h3 className="font-semibold mb-2" style={{ color: "#1A1A1A", fontSize: 16 }}>{currentTitle}</h3>

                      {titulos.length > 0 && tab === "revisao" && (
                        <div className="mb-3">
                          <div className="text-[11px] font-semibold mb-2" style={{ color: "#999" }}>Escolha o titulo:</div>
                          <div className="flex flex-col gap-1.5">
                            {titulos.map((t: any, i: number) => (
                              <button
                                key={i}
                                onClick={() => setEditingTitle({ ...editingTitle, [n.id]: t.titulo })}
                                className="flex items-center gap-2 p-2 text-left transition-all"
                                style={{
                                  borderRadius: 6,
                                  border: currentTitle === t.titulo ? `2px solid ${P}` : "1px solid #F0F0F0",
                                  background: currentTitle === t.titulo ? "#FFF0ED" : "#FAFAFA",
                                }}
                              >
                                <span style={{ fontSize: 14 }}>
                                  {t.tipo === "viral" ? "🔥" : t.tipo === "seo" ? "📈" : "⚖️"}
                                </span>
                                <span className="flex-1 text-xs font-medium" style={{ color: "#1A1A1A" }}>{t.titulo}</span>
                                <span className="text-[10px]" style={{ color: "#999" }}>{t.score}/10</span>
                              </button>
                            ))}
                          </div>
                          <input
                            type="text"
                            value={currentTitle}
                            onChange={(e) => setEditingTitle({ ...editingTitle, [n.id]: e.target.value })}
                            className="w-full mt-2 px-3 py-2 text-sm outline-none"
                            style={{ border: "1px solid #E5E5E5", borderRadius: 6, color: "#1A1A1A" }}
                          />
                        </div>
                      )}

                      <p className="mb-2" style={{ fontSize: 13, color: "#666", lineHeight: 1.5 }}>{n.resumo}</p>

                      <FontesBadges fontesJson={n.fontes_usadas} fonteOriginal={n.fonte_original} />

                      <button
                        onClick={() => setExpandedId(expandedId === n.id ? null : n.id)}
                        className="text-[11px] font-semibold mb-3"
                        style={{ color: P, background: "none", border: "none", cursor: "pointer" }}
                      >
                        {expandedId === n.id ? "Recolher ↑" : "Ver conteudo ↓"}
                      </button>

                      {expandedId === n.id && (
                        <>
                          <div
                            className="mb-2 p-3"
                            style={{ background: "#FAFAFA", borderRadius: 8, fontSize: 13, lineHeight: 1.7, color: "#333", maxHeight: 400, overflowY: "auto" }}
                          >
                            <div dangerouslySetInnerHTML={{ __html: processarHtmlComGraficos(n.conteudo_gerado || "", API_URL) }} />
                          </div>
                          <button
                            onClick={() => {
                              const texto = (n.conteudo_gerado || "").replace(/<[^>]+>/g, "")
                              navigator.clipboard.writeText(texto)
                              setCopiadoId(n.id)
                              setTimeout(() => setCopiadoId(null), 2000)
                            }}
                            className="text-[11px] font-semibold mb-3 px-2.5 py-1 rounded"
                            style={{ color: copiadoId === n.id ? "#2E7D32" : "#666", border: "1px solid #E5E5E5", background: copiadoId === n.id ? "#E8F5E9" : "#fff", cursor: "pointer" }}
                          >
                            {copiadoId === n.id ? "Copiado!" : "Copiar texto"}
                          </button>
                        </>
                      )}

                      <FluxoActions
                        status={tab}
                        onAprovar={() => action(n.id, "aprovar", { titulo_escolhido: currentTitle })}
                        onRejeitar={() => action(n.id, "rejeitar")}
                        onPublicar={() => action(n.id, "publicar")}
                        onRefazerTexto={() => setModalTextoId(n.id)}
                        onRefazerImagem={() => setModalImagemId(n.id)}
                        onVoltarRevisao={() => action(n.id, "voltar_revisao")}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Modal imagem expandida ──────────────────────────────────── */}
      {imagemExpandida && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.8)" }}
          onClick={() => setImagemExpandida(null)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={imagemExpandida}
              alt=""
              style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8 }}
            />
            <button
              onClick={() => setImagemExpandida(null)}
              className="absolute flex items-center justify-center"
              style={{ top: -12, right: -12, width: 28, height: 28, background: "#fff", borderRadius: "50%", border: "none", fontSize: 16, color: "#333", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
            >
              ×
            </button>
            <a
              href={imagemExpandida}
              download
              className="absolute flex items-center justify-center"
              style={{ bottom: 12, right: 12, padding: "6px 14px", background: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#333", textDecoration: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
            >
              Baixar
            </a>
          </div>
        </div>
      )}

      {/* ── Modais ────────────────────────────────────────────────────── */}
      <ModalRefazerTexto
        open={modalTextoId !== null}
        onClose={() => setModalTextoId(null)}
        onRefazer={(instrucao) => { if (modalTextoId) refazerTexto(modalTextoId, instrucao) }}
      />
      <ModalRefazerImagem
        open={modalImagemId !== null}
        onClose={() => setModalImagemId(null)}
        onRefazer={(params) => { if (modalImagemId) refazerImagem(modalImagemId, params) }}
      />
    </>
  )
}
