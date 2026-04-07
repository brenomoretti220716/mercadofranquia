"use client"

import { PreviewCriativo } from "./PreviewCriativo"

const P = "#E8421A"

interface CardItem {
  id: number
  card_html: string
  tipo: string
  legenda?: string
  status_editorial?: string
}

interface Props {
  cards: CardItem[]
  cardSelecionado?: number | null
  onSelect: (id: number) => void
}

export function GaleriaCards({ cards, cardSelecionado, onSelect }: Props) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((c) => (
        <div key={c.id}>
          <PreviewCriativo
            html={c.card_html || ""}
            tamanho={cardSelecionado === c.id ? "grande" : "medio"}
            ativo={cardSelecionado === c.id}
            badge={c.tipo}
            onClick={() => onSelect(c.id)}
            rodape={
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-semibold" style={{ color: "#999" }}>
                  {c.legenda?.slice(0, 30)}{c.legenda && c.legenda.length > 30 ? "..." : ""}
                </span>
                {c.status_editorial && (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{
                    background: c.status_editorial === "aprovado" ? "#E8F5E9" : c.status_editorial === "publicado" ? "#E8F5E9" : "#F5F5F5",
                    color: c.status_editorial === "aprovado" || c.status_editorial === "publicado" ? "#2E7D32" : "#999",
                  }}>
                    {c.status_editorial}
                  </span>
                )}
              </div>
            }
          />
        </div>
      ))}
    </div>
  )
}
