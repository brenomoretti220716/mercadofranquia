"use client"

import { Card, CardContent } from "@/components/ui/card"

const CARD_STYLE = { background: "#fff", border: "0.5px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }
const COR_PRIMARIA = "#1D9E75"

function calcProximoRelatorioABF() {
  const now = new Date()
  const trimestres = [
    { fim: new Date(now.getFullYear(), 2, 31), label: "1T" },
    { fim: new Date(now.getFullYear(), 5, 30), label: "2T" },
    { fim: new Date(now.getFullYear(), 8, 30), label: "3T" },
    { fim: new Date(now.getFullYear(), 11, 31), label: "4T" },
  ]

  for (const t of trimestres) {
    const publicacao = new Date(t.fim)
    publicacao.setDate(publicacao.getDate() + 45)
    if (publicacao > now) {
      const diasRestantes = Math.ceil((publicacao.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return { label: `${t.label} ${now.getFullYear()}`, data: publicacao, dias: diasRestantes }
    }
  }

  const proxAno = new Date(now.getFullYear() + 1, 2, 31)
  proxAno.setDate(proxAno.getDate() + 45)
  const dias = Math.ceil((proxAno.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return { label: `1T ${now.getFullYear() + 1}`, data: proxAno, dias }
}

function badgeRelatorio(dias: number) {
  if (dias < 0) return { label: "Verificar ABF", bg: "#FCEBEB", color: "#A32D2D" }
  if (dias <= 30) return { label: "Em breve", bg: "#FFF8E1", color: "#B8860B" }
  return { label: `${dias} dias`, bg: "#E1F5EE", color: "#0F6E56" }
}

const ADMIN_KPIS = [
  { label: "Total relatorios", valor: "42", icon: "◫" },
  { label: "Ultimo sync", valor: "Mar/2026", icon: "↻" },
  { label: "Registros no banco", valor: "2.847", icon: "◉" },
  { label: "Fontes ativas", valor: "5", icon: "◎" },
]

export default function AdminDashboard() {
  const proximo = calcProximoRelatorioABF()
  const badge = badgeRelatorio(proximo.dias)

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-medium" style={{ color: "#1a1a18" }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "#888" }}>
          Visao geral do backoffice
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {ADMIN_KPIS.map((k) => (
          <Card key={k.label} className="border-0 shadow-none" style={CARD_STYLE}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-wider" style={{ color: "#aaa" }}>
                  {k.label}
                </span>
                <span style={{ fontSize: 16, color: "#ccc" }}>{k.icon}</span>
              </div>
              <div className="text-2xl font-medium" style={{ color: "#1a1a18" }}>
                {k.valor}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-none" style={CARD_STYLE}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "#aaa" }}>
                Proximo relatorio ABF esperado
              </div>
              <div className="text-base font-medium" style={{ color: "#1a1a18" }}>
                {proximo.label}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "#888" }}>
                Estimativa: {proximo.data.toLocaleDateString("pt-BR")} (trimestre + 45 dias)
              </div>
            </div>
            <span
              className="inline-block text-xs font-medium rounded-full px-4 py-1.5"
              style={{ background: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
