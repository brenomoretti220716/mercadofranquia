"use client"

const P = "#E8421A"

const TIPO_COR: Record<string, { bg: string; cor: string; icon: string }> = {
  relatorio: { bg: "#FFF0ED", cor: P, icon: "📊" },
  macro: { bg: "#EBF5FF", cor: "#2563EB", icon: "🏦" },
  franquias: { bg: "#E8F5E9", cor: "#2E7D32", icon: "▣" },
}

interface Fonte {
  nome: string
  tipo: string
  dado: string
  periodo: string
  citacao: string
}

interface Props {
  fontesJson: string | null
  fonteOriginal?: string | null
  compacto?: boolean
}

export function FontesBadges({ fontesJson, fonteOriginal, compacto = false }: Props) {
  let fontes: Fonte[] = []
  try { fontes = JSON.parse(fontesJson || "[]") } catch {}
  if (fontes.length === 0 && !fonteOriginal) return null

  return (
    <div className={compacto ? "flex flex-wrap gap-1" : "mb-3"}>
      {!compacto && <div className="text-[10px] font-semibold mb-1.5" style={{ color: "#999" }}>Fontes utilizadas:</div>}
      <div className="flex flex-wrap gap-1.5">
        {fonteOriginal && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: "#F5F5F5", color: "#666" }} title={`Fonte original: ${fonteOriginal}`}>
            📰 {fonteOriginal}
          </span>
        )}
        {fontes.map((f, i) => {
          const cfg = TIPO_COR[f.tipo] || TIPO_COR.macro
          return (
            <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: cfg.bg, color: cfg.cor }} title={`${f.dado} — ${f.citacao}`}>
              {cfg.icon} {f.nome} — {f.citacao}
            </span>
          )
        })}
      </div>
    </div>
  )
}
