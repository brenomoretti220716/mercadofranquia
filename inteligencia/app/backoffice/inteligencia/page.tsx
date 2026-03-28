"use client"

import { useState, useEffect } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const P = "#E8421A"
const CS = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }

const LINKS = [
  { href: "/backoffice/dashboard-dados", label: "Dashboard de Dados", desc: "5 abas com dados ABF, BCB, IBGE, CAGED", icon: "📈" },
  { href: "/backoffice/franquias", label: "Franquias", desc: "Base de 1.387 franquias com investimento e segmento", icon: "▣" },
  { href: "/backoffice/relatorios", label: "Relatorios ABF", desc: "Gestao de relatorios trimestrais e anuais", icon: "◫" },
  { href: "/backoffice/upload", label: "Upload PDF", desc: "Extrair dados de PDFs com IA", icon: "↑" },
  { href: "/backoffice/fontes", label: "Central de Fontes", desc: "Status de todas as fontes de dados", icon: "◎" },
]

export default function InteligenciaPage() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/admin/stats`).then((r) => r.ok ? r.json() : []).then(setStats).catch(() => {})
  }, [])

  const getCount = (tabela: string) => stats?.find((s: any) => s.tabela === tabela)?.registros ?? "—"

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-medium" style={{ color: "#1a1a18" }}>Inteligencia</h1>
        <p className="text-sm mt-1" style={{ color: "#888" }}>Dados, dashboards e fontes</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Franquias", valor: getCount("franquias"), cor: P },
          { label: "Relatorios ABF", valor: getCount("relatorios"), cor: "#999" },
          { label: "Series macro (BCB)", valor: getCount("macro_bcb"), cor: "#999" },
          { label: "Registros PMC", valor: getCount("pmc_ibge"), cor: "#999" },
        ].map((k) => (
          <div key={k.label} className="p-5" style={CS}>
            <div className="uppercase tracking-wider font-semibold mb-2" style={{ color: "#999", fontSize: 11 }}>{k.label}</div>
            <div className="font-bold" style={{ color: k.cor, fontSize: 28 }}>{typeof k.valor === "number" ? k.valor.toLocaleString("pt-BR") : k.valor}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} className="flex items-center gap-4 p-4 transition-all" style={{ ...CS, border: "1px solid #F0F0F0" }}>
            <span style={{ fontSize: 24 }}>{l.icon}</span>
            <div>
              <div className="font-semibold" style={{ fontSize: 14, color: "#1A1A1A" }}>{l.label}</div>
              <div style={{ fontSize: 12, color: "#888" }}>{l.desc}</div>
            </div>
          </a>
        ))}
      </div>
    </>
  )
}
