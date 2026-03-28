"use client"

const SCALES: Record<string, number> = {
  miniatura: 80 / 1080,
  medio: 240 / 1080,
  grande: 480 / 1080,
  fullsize: 1,
}

const SIZES: Record<string, number> = {
  miniatura: 80,
  medio: 240,
  grande: 480,
  fullsize: 1080,
}

interface Props {
  html: string
  tamanho?: "miniatura" | "medio" | "grande" | "fullsize"
  ativo?: boolean
  badge?: string
  onClick?: () => void
  rodape?: React.ReactNode
}

export function PreviewCriativo({ html, tamanho = "medio", ativo = false, badge, onClick, rodape }: Props) {
  const size = SIZES[tamanho]
  const scale = SCALES[tamanho]

  return (
    <div className="flex flex-col" style={{ width: size }}>
      <div
        className="relative shrink-0 cursor-pointer"
        onClick={onClick}
        style={{
          width: size,
          height: size,
          background: "#111",
          borderRadius: tamanho === "miniatura" ? 4 : 8,
          overflow: "hidden",
          border: ativo ? "2px solid #E8421A" : "1.5px solid #222",
          boxShadow: ativo ? "0 4px 24px rgba(232,66,26,0.3)" : "0 4px 24px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            width: 1080,
            height: 1080,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            pointerEvents: "none",
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {badge && (
          <div style={{
            position: "absolute",
            top: tamanho === "miniatura" ? 2 : 6,
            right: tamanho === "miniatura" ? 2 : 6,
            background: "rgba(0,0,0,0.7)",
            color: "#fff",
            fontSize: tamanho === "miniatura" ? 8 : 10,
            padding: tamanho === "miniatura" ? "1px 3px" : "2px 6px",
            borderRadius: 4,
            fontWeight: 600,
          }}>
            {badge}
          </div>
        )}
      </div>
      {rodape && <div className="mt-1">{rodape}</div>}
    </div>
  )
}
