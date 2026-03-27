"use client"

interface InsightBoxProps {
  insights: string[]
}

export function InsightBox({ insights }: InsightBoxProps) {
  if (insights.length === 0) return null
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      {insights.map((texto, i) => (
        <div
          key={i}
          className="flex items-start gap-2 px-3.5 py-2.5"
          style={{
            background: "#FFF0ED",
            borderLeft: "3px solid #E8421A",
            borderRadius: 6,
            fontSize: 13,
            lineHeight: 1.5,
            color: "#1A1A1A",
          }}
        >
          <span style={{ flexShrink: 0 }}>💡</span>
          <span dangerouslySetInnerHTML={{ __html: texto }} />
        </div>
      ))}
    </div>
  )
}

/** Formata número com destaque laranja em negrito */
export function h(valor: string | number): string {
  return `<strong style="color:#E8421A">${valor}</strong>`
}
