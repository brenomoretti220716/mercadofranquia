"use client"

import { useState, useRef } from "react"

const P = "#E8421A"

type Aba = "texto" | "imagem" | "instrucao"

interface Props {
  open: boolean
  onClose: () => void
  // Texto
  onRefazerTexto?: () => void
  // Imagem
  onRefazerImagem?: (params: { referenciaUrl?: string; instrucao?: string }) => void
  // Instrução completa (reescrever artigo)
  onRefazer?: (instrucao: string) => void
  // Qual aba abrir por padrão
  abaInicial?: Aba
  tipoSelect?: { id: string; label: string }[]
}

export function ModalRefazer({
  open,
  onClose,
  onRefazerTexto,
  onRefazerImagem,
  onRefazer,
  abaInicial = "texto",
  tipoSelect,
}: Props) {
  const [aba, setAba] = useState<Aba>(abaInicial)
  const [instrucao, setInstrucao] = useState("")
  const [referenciaUrl, setReferenciaUrl] = useState("")
  const [instrucaoImagem, setInstrucaoImagem] = useState("")
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  // Ao abrir, reseta para a aba inicial
  // (useEffect seria ideal mas para manter simples usamos abaInicial como prop)

  async function handleRefazerTexto() {
    if (!onRefazerTexto) return
    setLoading(true)
    await onRefazerTexto()
    setLoading(false)
    onClose()
  }

  async function handleRefazerImagem() {
    if (!onRefazerImagem) return
    setLoading(true)
    await onRefazerImagem({ referenciaUrl: referenciaUrl || undefined, instrucao: instrucaoImagem || undefined })
    setLoading(false)
    setReferenciaUrl("")
    setInstrucaoImagem("")
    onClose()
  }

  async function handleRefazerInstrucao() {
    if (!onRefazer || !instrucao.trim()) return
    setLoading(true)
    await onRefazer(instrucao)
    setLoading(false)
    setInstrucao("")
    onClose()
  }

  const ABAS: { id: Aba; label: string; show: boolean }[] = [
    { id: "texto",    label: "↺ Texto",    show: !!onRefazerTexto },
    { id: "imagem",   label: "↺ Imagem",   show: !!onRefazerImagem },
    { id: "instrucao",label: "+ Instrução", show: !!onRefazer },
  ].filter((a) => a.show)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="p-6" style={{ background: "#fff", borderRadius: 12, width: 500, maxWidth: "90vw", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ fontSize: 16, color: "#1A1A1A" }}>Refazer</h3>
          <button onClick={onClose} style={{ color: "#999", fontSize: 20, background: "none", border: "none", cursor: "pointer" }}>×</button>
        </div>

        {/* Abas */}
        {ABAS.length > 1 && (
          <div className="flex gap-1 mb-4 p-1 rounded-lg" style={{ background: "#F5F5F5" }}>
            {ABAS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAba(a.id)}
                className="flex-1 py-1.5 text-xs font-semibold rounded-md transition-all"
                style={{
                  background: aba === a.id ? "#fff" : "transparent",
                  color: aba === a.id ? "#1A1A1A" : "#999",
                  boxShadow: aba === a.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Aba Texto ────────────────────────────────────────────────── */}
        {aba === "texto" && (
          <div>
            <p className="mb-4 text-sm" style={{ color: "#666", lineHeight: 1.6 }}>
              A IA vai reescrever o artigo mantendo o mesmo tema, segmento e fontes — mas com uma abordagem editorial renovada.
            </p>
            <div className="flex justify-end gap-2">
              <BtnModal onClick={onClose} variante="secundario">Cancelar</BtnModal>
              <BtnModal onClick={handleRefazerTexto} variante="primario" loading={loading}>
                {loading ? "Reescrevendo..." : "Reescrever agora"}
              </BtnModal>
            </div>
          </div>
        )}

        {/* ── Aba Imagem ───────────────────────────────────────────────── */}
        {aba === "imagem" && (
          <div>
            <div className="mb-3">
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#666" }}>
                URL de referência <span style={{ color: "#BBB", fontWeight: 400 }}>(opcional)</span>
              </label>
              <input
                type="url"
                value={referenciaUrl}
                onChange={(e) => setReferenciaUrl(e.target.value)}
                placeholder="https://site.com/imagem.jpg ou URL de uma página"
                className="w-full px-3 py-2 text-sm outline-none"
                style={{ border: "1px solid #E5E5E5", borderRadius: 8, color: "#1A1A1A" }}
              />
              <p className="mt-1 text-[10px]" style={{ color: "#BBB" }}>
                Cole a URL de uma imagem ou página — o sistema vai extrair a imagem de referência automaticamente.
              </p>
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#666" }}>
                Instrução adicional <span style={{ color: "#BBB", fontWeight: 400 }}>(opcional)</span>
              </label>
              <textarea
                value={instrucaoImagem}
                onChange={(e) => setInstrucaoImagem(e.target.value)}
                placeholder="Ex: foco na cozinha, ambiente externo, mais dinâmico, sem pessoas..."
                className="w-full px-3 py-2 text-sm outline-none"
                style={{ border: "1px solid #E5E5E5", borderRadius: 8, minHeight: 72, resize: "vertical", color: "#1A1A1A" }}
              />
            </div>

            <div className="flex justify-end gap-2">
              <BtnModal onClick={onClose} variante="secundario">Cancelar</BtnModal>
              <BtnModal onClick={handleRefazerImagem} variante="azul" loading={loading}>
                {loading ? "Gerando..." : "Gerar nova imagem"}
              </BtnModal>
            </div>
          </div>
        )}

        {/* ── Aba Instrução ────────────────────────────────────────────── */}
        {aba === "instrucao" && (
          <div>
            <textarea
              value={instrucao}
              onChange={(e) => setInstrucao(e.target.value)}
              placeholder="O que quer mudar? Ex: mais curto, foco na Selic, tom mais técnico, trocar para ranking..."
              className="w-full px-3 py-2.5 text-sm outline-none mb-3"
              style={{ border: "1px solid #E5E5E5", borderRadius: 8, minHeight: 100, resize: "vertical", color: "#1A1A1A" }}
            />

            {tipoSelect && (
              <div className="mb-4">
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#999" }}>Atalhos:</label>
                <div className="flex gap-1.5 flex-wrap">
                  {tipoSelect.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setInstrucao((prev) => prev ? `${prev} ${t.label}` : t.label)}
                      className="px-2.5 py-1 text-[10px] font-semibold rounded-full"
                      style={{ border: "1px solid #E5E5E5", color: "#666", background: "#FAFAFA" }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <BtnModal onClick={onClose} variante="secundario">Cancelar</BtnModal>
              <BtnModal onClick={handleRefazerInstrucao} variante="roxo" loading={loading} disabled={!instrucao.trim()}>
                {loading ? "Refazendo..." : "Refazer com IA"}
              </BtnModal>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// ── Botão interno do modal ───────────────────────────────────────────────────

function BtnModal({
  onClick,
  variante,
  loading,
  disabled,
  children,
}: {
  onClick: () => void
  variante: "primario" | "secundario" | "roxo" | "azul"
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
}) {
  const estilos = {
    primario:   { background: P,         color: "#fff",    border: "none" },
    secundario: { background: "transparent", color: "#666", border: "1px solid #E5E5E5" },
    roxo:       { background: "#7C4DFF", color: "#fff",    border: "none" },
    azul:       { background: "#1565C0", color: "#fff",    border: "none" },
  }
  const s = estilos[variante]
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="px-4 py-2 text-xs font-semibold rounded-lg"
      style={{ ...s, opacity: loading || disabled ? 0.5 : 1, cursor: loading || disabled ? "not-allowed" : "pointer" }}
    >
      {children}
    </button>
  )
}
