"use client"

import { useState, useEffect } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const P = "#E8421A"
const CS = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [noticiaStats, setNoticiaStats] = useState<any>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/admin/stats`).then((r) => r.ok ? r.json() : []).then(setStats).catch(() => {})
    fetch(`${API_URL}/api/noticias/stats`).then((r) => r.ok ? r.json() : null).then(setNoticiaStats).catch(() => {})
  }, [])

  const getCount = (tabela: string) => stats?.find((s: any) => s.tabela === tabela)?.registros ?? 0

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-medium" style={{ color: "#1a1a18" }}>Dashboard Admin</h1>
        <p className="text-sm mt-1" style={{ color: "#888" }}>Visao geral do backoffice Mercado Franquia</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <a href="/backoffice/editorial" className="p-5 transition-all" style={{ ...CS, border: "1px solid #F0F0F0" }}>
          <div className="uppercase tracking-wider font-semibold mb-2" style={{ color: "#999", fontSize: 11 }}>Noticias pendentes</div>
          <div className="font-bold" style={{ color: P, fontSize: 32 }}>{noticiaStats?.fila?.pendente ?? "—"}</div>
          <div className="text-xs mt-1" style={{ color: "#999" }}>Aguardando revisao editorial →</div>
        </a>
        <a href="/backoffice/studio" className="p-5 transition-all" style={{ ...CS, border: "1px solid #F0F0F0" }}>
          <div className="uppercase tracking-wider font-semibold mb-2" style={{ color: "#999", fontSize: 11 }}>Noticias publicadas</div>
          <div className="font-bold" style={{ color: "#2E7D32", fontSize: 32 }}>{noticiaStats?.publicadas ?? "—"}</div>
          <div className="text-xs mt-1" style={{ color: "#999" }}>Ver no Studio Social →</div>
        </a>
        <a href="/backoffice/fontes" className="p-5 transition-all" style={{ ...CS, border: "1px solid #F0F0F0" }}>
          <div className="uppercase tracking-wider font-semibold mb-2" style={{ color: "#999", fontSize: 11 }}>Noticias coletadas</div>
          <div className="font-bold" style={{ color: "#1A1A1A", fontSize: 32 }}>{noticiaStats?.raw?.total ?? "—"}</div>
          <div className="text-xs mt-1" style={{ color: "#999" }}>Central de Fontes →</div>
        </a>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Franquias", valor: getCount("franquias"), href: "/backoffice/franquias" },
          { label: "Relatorios ABF", valor: getCount("relatorios"), href: "/backoffice/relatorios" },
          { label: "Series BCB", valor: getCount("macro_bcb"), href: "/backoffice/fontes" },
          { label: "Registros CAGED", valor: getCount("caged_bcb"), href: "/backoffice/fontes" },
        ].map((k) => (
          <a key={k.label} href={k.href} className="p-4" style={{ ...CS, border: "1px solid #F0F0F0" }}>
            <div className="uppercase tracking-wider font-semibold mb-1" style={{ color: "#999", fontSize: 10 }}>{k.label}</div>
            <div className="font-bold" style={{ color: "#1A1A1A", fontSize: 24 }}>{typeof k.valor === "number" ? k.valor.toLocaleString("pt-BR") : k.valor}</div>
          </a>
        ))}
      </div>

      {/* Links rápidos */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { href: "/backoffice/dashboard-dados", label: "Dashboard de Dados", desc: "5 abas de analise ABF + BCB + IBGE", icon: "📊" },
          { href: "/backoffice/editorial", label: "Editorial", desc: "Gerenciar noticias e artigos", icon: "📰" },
          { href: "/backoffice/studio", label: "Studio Social", desc: "Cards e carrosseis para Instagram", icon: "🎨" },
          { href: "/backoffice/fontes", label: "Central de Fontes", desc: "Status e sync de todas as fontes", icon: "◎" },
        ].map((l) => (
          <a key={l.href} href={l.href} className="flex items-center gap-3 p-4 transition-all" style={{ ...CS, border: "1px solid #F0F0F0" }}>
            <span style={{ fontSize: 22 }}>{l.icon}</span>
            <div>
              <div className="font-semibold" style={{ fontSize: 13, color: "#1A1A1A" }}>{l.label}</div>
              <div style={{ fontSize: 11, color: "#888" }}>{l.desc}</div>
            </div>
          </a>
        ))}
      </div>
    </>
  )
}
