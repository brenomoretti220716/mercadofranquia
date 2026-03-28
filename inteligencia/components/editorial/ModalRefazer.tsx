"use client"

import { useState } from "react"

const P = "#E8421A"

interface Props {
  open: boolean
  onClose: () => void
  onRefazer: (instrucao: string) => void
  tipoSelect?: { id: string; label: string }[]
}

export function ModalRefazer({ open, onClose, onRefazer, tipoSelect }: Props) {
  const [instrucao, setInstrucao] = useState("")
  const [loading, setLoading] = useState(false)

  if (!open) return null

  async function handleRefazer() {
    setLoading(true)
    await onRefazer(instrucao)
    setLoading(false)
    setInstrucao("")
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="p-6" style={{ background: "#fff", borderRadius: 12, width: 480, maxWidth: "90vw", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ fontSize: 16, color: "#1A1A1A" }}>Refazer com IA</h3>
          <button onClick={onClose} style={{ color: "#999", fontSize: 18, background: "none", border: "none" }}>×</button>
        </div>

        <textarea
          value={instrucao}
          onChange={(e) => setInstrucao(e.target.value)}
          placeholder="O que quer mudar? Ex: mais curto, foco na Selic, tom mais tecnico, trocar para ranking..."
          className="w-full px-3 py-2.5 text-sm outline-none mb-4"
          style={{ border: "1px solid #E5E5E5", borderRadius: 8, minHeight: 100, resize: "vertical", color: "#1A1A1A" }}
        />

        {tipoSelect && (
          <div className="mb-4">
            <label className="text-xs font-semibold mb-1 block" style={{ color: "#999" }}>Tipo de conteudo:</label>
            <div className="flex gap-1.5 flex-wrap">
              {tipoSelect.map((t) => (
                <button key={t.id} onClick={() => setInstrucao(instrucao + ` Tipo: ${t.label}`)} className="px-2.5 py-1 text-[10px] font-semibold rounded-full" style={{ border: "1px solid #E5E5E5", color: "#666" }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold rounded-lg" style={{ color: "#666", border: "1px solid #E5E5E5" }}>Cancelar</button>
          <button onClick={handleRefazer} disabled={loading || !instrucao.trim()} className="px-4 py-2 text-xs font-semibold text-white rounded-lg" style={{ background: loading ? "#999" : "#7C4DFF", opacity: !instrucao.trim() ? 0.5 : 1 }}>
            {loading ? "Refazendo..." : "Refazer com IA"}
          </button>
        </div>
      </div>
    </div>
  )
}
