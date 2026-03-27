"use client"

const P = "#E8421A"
const VERDE = "#2E7D32"
const AMARELO = "#F59E0B"
const VERMELHO = "#D32F2F"

interface Props {
  trimestrais: { periodo: string; valor_mm: number }[]
}

export function TermometroTrimestral({ trimestrais }: Props) {
  if (trimestrais.length < 4) return null

  // Ordenar e pegar último trimestre
  const sorted = [...trimestrais].sort((a, b) => a.periodo.localeCompare(b.periodo))
  const ultimo = sorted[sorted.length - 1]
  const periodoUlt = ultimo.periodo // ex: "3T2025"
  const triNum = periodoUlt.match(/(\d)T/)?.[1] || "3"
  const anoUlt = periodoUlt.match(/(\d{4})/)?.[1] || "2025"

  // Mesmo trimestre do ano anterior
  const mesmoTriAnterior = sorted.find((t) => {
    const tri = t.periodo.match(/(\d)T/)?.[1]
    const ano = t.periodo.match(/(\d{4})/)?.[1]
    return tri === triNum && ano === String(Number(anoUlt) - 1)
  })

  const crescUltimo = mesmoTriAnterior
    ? +((ultimo.valor_mm / mesmoTriAnterior.valor_mm - 1) * 100).toFixed(1)
    : 0

  // Média histórica de crescimento trimestral YoY
  const crescimentos: number[] = []
  for (const t of sorted) {
    const tri = t.periodo.match(/(\d)T/)?.[1]
    const ano = t.periodo.match(/(\d{4})/)?.[1]
    if (!tri || !ano) continue
    const anterior = sorted.find((s) => {
      const sTri = s.periodo.match(/(\d)T/)?.[1]
      const sAno = s.periodo.match(/(\d{4})/)?.[1]
      return sTri === tri && sAno === String(Number(ano) - 1)
    })
    if (anterior) {
      crescimentos.push(+((t.valor_mm / anterior.valor_mm - 1) * 100).toFixed(1))
    }
  }
  const mediaHist = crescimentos.length > 0
    ? +(crescimentos.reduce((a, b) => a + b, 0) / crescimentos.length).toFixed(1)
    : 0

  // Classificação
  const diff = crescUltimo - mediaHist
  const status = diff > 2 ? "acima" : diff < -2 ? "abaixo" : "na media"
  const cor = status === "acima" ? VERDE : status === "abaixo" ? VERMELHO : AMARELO
  const corBg = status === "acima" ? "#E8F5E9" : status === "abaixo" ? "#FFEBEE" : "#FFF8E1"
  const label = status === "acima" ? "Acima da media" : status === "abaixo" ? "Abaixo da media" : "Na media historica"

  // Ângulo da agulha: 0° = esquerda (0%), 180° = direita (max)
  const maxGauge = Math.max(mediaHist * 2, crescUltimo * 1.3, 20)
  const angulo = Math.min(Math.max((crescUltimo / maxGauge) * 180, 5), 175)

  return (
    <div className="p-5 mb-4" style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div className="flex items-center gap-6">
        {/* Gauge */}
        <div className="relative shrink-0" style={{ width: 120, height: 65 }}>
          <svg viewBox="0 0 120 65" style={{ width: 120, height: 65 }}>
            {/* Arco de fundo */}
            <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#F0F0F0" strokeWidth="8" strokeLinecap="round" />
            {/* Arco de cor */}
            <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke={cor} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${(angulo / 180) * 157} 157`} />
            {/* Agulha */}
            <line
              x1="60" y1="60"
              x2={60 + 40 * Math.cos((Math.PI * (180 - angulo)) / 180)}
              y2={60 - 40 * Math.sin((Math.PI * (180 - angulo)) / 180)}
              stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"
            />
            <circle cx="60" cy="60" r="4" fill="#1A1A1A" />
          </svg>
        </div>

        {/* Dados */}
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-bold" style={{ fontSize: 28, color: "#1A1A1A" }}>
              {crescUltimo > 0 ? "+" : ""}{crescUltimo}%
            </span>
            <span className="font-semibold" style={{ fontSize: 13, color: "#999" }}>
              {periodoUlt}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold px-2 py-0.5" style={{ fontSize: 11, background: corBg, color: cor, borderRadius: 4 }}>
              {label}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#999" }}>
            Media historica: {mediaHist > 0 ? "+" : ""}{mediaHist}% por trimestre (YoY)
          </div>
        </div>

        {/* Título */}
        <div className="text-right shrink-0">
          <div className="uppercase tracking-wider font-semibold" style={{ fontSize: 10, color: "#999" }}>Termometro Trimestral</div>
          <div style={{ fontSize: 10, color: "#CCC" }}>Crescimento vs mesmo tri do ano anterior</div>
          <div style={{ fontSize: 10, color: "#CCC" }}>Fonte: ABF</div>
        </div>
      </div>
    </div>
  )
}
