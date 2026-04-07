"use client"

const P = "#E8421A"

interface Props {
  status: string
  onAprovar?: () => void
  onRejeitar?: () => void
  onPublicar?: () => void
  onRefazer?: () => void
  onRefazerTexto?: () => void
  onRefazerImagem?: () => void
  onVoltarRevisao?: () => void
  extra?: React.ReactNode
}

export function FluxoActions({
  status,
  onAprovar,
  onRejeitar,
  onPublicar,
  onRefazer,
  onRefazerTexto,
  onRefazerImagem,
  onVoltarRevisao,
  extra,
}: Props) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {status === "revisao" && (
        <>
          {onAprovar && <Btn onClick={onAprovar} cor="verde">Aprovar</Btn>}
          {onRejeitar && <Btn onClick={onRejeitar} cor="vermelho">Rejeitar</Btn>}
          {onRefazerTexto && <Btn onClick={onRefazerTexto} cor="roxo">↺ Texto</Btn>}
          {onRefazerImagem && <Btn onClick={onRefazerImagem} cor="azul">↺ Imagem</Btn>}
          {onRefazer && <Btn onClick={onRefazer} cor="cinza">+ Instrução</Btn>}
        </>
      )}
      {status === "aprovado" && (
        <>
          {onPublicar && <Btn onClick={onPublicar} cor="verde">Publicar</Btn>}
          {onRefazerTexto && <Btn onClick={onRefazerTexto} cor="roxo">↺ Texto</Btn>}
          {onRefazerImagem && <Btn onClick={onRefazerImagem} cor="azul">↺ Imagem</Btn>}
          {onRefazer && <Btn onClick={onRefazer} cor="cinza">+ Instrução</Btn>}
          {onVoltarRevisao && <Btn onClick={onVoltarRevisao} cor="cinza">Voltar</Btn>}
        </>
      )}
      {status === "publicado" && (
        <>
          {onVoltarRevisao && <Btn onClick={onVoltarRevisao} cor="cinza">Despublicar</Btn>}
        </>
      )}
      {status === "rejeitado" && (
        <>
          {onVoltarRevisao && <Btn onClick={onVoltarRevisao} cor="laranja">Tentar novamente</Btn>}
        </>
      )}
      {extra}
    </div>
  )
}

// ── Botão base reutilizável ──────────────────────────────────────────────────

const CORES: Record<string, { bg?: string; color: string; border?: string }> = {
  verde:    { bg: "#2E7D32", color: "#fff" },
  vermelho: { color: "#D32F2F", border: "1px solid #FFCDD2" },
  roxo:     { color: "#7C4DFF", border: "1px solid #D1C4E9" },
  azul:     { color: "#1565C0", border: "1px solid #BBDEFB" },
  laranja:  { color: P, border: `1px solid ${P}` },
  cinza:    { color: "#666", border: "1px solid #E5E5E5" },
}

function Btn({ onClick, cor, children }: { onClick: () => void; cor: keyof typeof CORES; children: React.ReactNode }) {
  const s = CORES[cor]
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-[10px] font-semibold rounded"
      style={{ background: s.bg, color: s.color, border: s.border }}
    >
      {children}
    </button>
  )
}

export function VersionBadge({ versao }: { versao?: number }) {
  if (!versao || versao <= 1) return null
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "#EBF5FF", color: "#2563EB" }}>
      v{versao}
    </span>
  )
}

export function RelevanceBadge({ score }: { score: number }) {
  const cor = score >= 8 ? "#2E7D32" : score >= 6 ? "#854F0B" : "#A32D2D"
  const bg  = score >= 8 ? "#E8F5E9" : score >= 6 ? "#FFF8E1" : "#FFEBEE"
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: bg, color: cor }}>
      {score}/10
    </span>
  )
}
