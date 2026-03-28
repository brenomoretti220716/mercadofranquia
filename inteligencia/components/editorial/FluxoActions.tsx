"use client"

const P = "#E8421A"

interface Props {
  status: string
  onAprovar?: () => void
  onRejeitar?: () => void
  onPublicar?: () => void
  onRefazer?: () => void
  onVoltarRevisao?: () => void
  extra?: React.ReactNode
}

export function FluxoActions({ status, onAprovar, onRejeitar, onPublicar, onRefazer, onVoltarRevisao, extra }: Props) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {status === "revisao" && (
        <>
          {onAprovar && <button onClick={onAprovar} className="px-3 py-1.5 text-[10px] font-semibold text-white rounded" style={{ background: "#2E7D32" }}>Aprovar</button>}
          {onRejeitar && <button onClick={onRejeitar} className="px-3 py-1.5 text-[10px] font-semibold rounded" style={{ color: "#D32F2F", border: "1px solid #FFCDD2" }}>Rejeitar</button>}
          {onRefazer && <button onClick={onRefazer} className="px-3 py-1.5 text-[10px] font-semibold rounded" style={{ color: "#7C4DFF", border: "1px solid #D1C4E9" }}>Refazer</button>}
        </>
      )}
      {status === "aprovado" && (
        <>
          {onPublicar && <button onClick={onPublicar} className="px-3 py-1.5 text-[10px] font-semibold text-white rounded" style={{ background: "#2E7D32" }}>Publicar</button>}
          {onRefazer && <button onClick={onRefazer} className="px-3 py-1.5 text-[10px] font-semibold rounded" style={{ color: "#7C4DFF", border: "1px solid #D1C4E9" }}>Refazer</button>}
          {onVoltarRevisao && <button onClick={onVoltarRevisao} className="px-3 py-1.5 text-[10px] font-semibold rounded" style={{ color: "#666", border: "1px solid #E5E5E5" }}>Voltar</button>}
        </>
      )}
      {status === "publicado" && (
        <>
          {onVoltarRevisao && <button onClick={onVoltarRevisao} className="px-3 py-1.5 text-[10px] font-semibold rounded" style={{ color: "#666", border: "1px solid #E5E5E5" }}>Despublicar</button>}
        </>
      )}
      {status === "rejeitado" && (
        <>
          {onVoltarRevisao && <button onClick={onVoltarRevisao} className="px-3 py-1.5 text-[10px] font-semibold rounded" style={{ color: P, border: `1px solid ${P}` }}>Tentar novamente</button>}
        </>
      )}
      {extra}
    </div>
  )
}

export function VersionBadge({ versao }: { versao?: number }) {
  if (!versao || versao <= 1) return null
  return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "#EBF5FF", color: "#2563EB" }}>v{versao}</span>
}

export function RelevanceBadge({ score }: { score: number }) {
  const cor = score >= 8 ? "#2E7D32" : score >= 6 ? "#854F0B" : "#A32D2D"
  const bg = score >= 8 ? "#E8F5E9" : score >= 6 ? "#FFF8E1" : "#FFEBEE"
  return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: bg, color: cor }}>{score}/10</span>
}
