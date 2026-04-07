"use client"

import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { SessionProvider } from "next-auth/react"

const NAV = [
  { type: "link", href: "/backoffice", label: "Dashboard Admin", icon: "◉" },
  { type: "section", label: "CONTEUDO" },
  { type: "link", href: "/backoffice/editorial", label: "Editorial", icon: "📰" },
  { type: "link", href: "/backoffice/studio", label: "Studio Social", icon: "🎨" },
  { type: "section", label: "DADOS" },
  { type: "link", href: "/backoffice/inteligencia", label: "Inteligencia", icon: "📊" },
  { type: "sub", href: "/backoffice/dashboard-dados", label: "Dashboard Dados" },
  { type: "sub", href: "/backoffice/franquias", label: "Franquias" },
  { type: "sub", href: "/backoffice/relatorios", label: "Relatorios ABF" },
  { type: "sub", href: "/backoffice/upload", label: "Upload PDF" },
  { type: "sub", href: "/backoffice/fontes", label: "Central de Fontes" },
  { type: "section", label: "SISTEMA" },
  { type: "link", href: "/backoffice/sistema", label: "Logs & Auditoria", icon: "⚙️" },
] as const

function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col justify-between py-6 px-4"
      style={{ width: 220, background: "#0D0D0D" }}
    >
      <div>
        <div className="mb-8">
          <img src="/logo-white.png" alt="Mercado Franquia" style={{ width: 140 }} />
          <p className="text-[10px] mt-1.5 px-1" style={{ color: "#555" }}>
            Intelligence Backoffice
          </p>
        </div>

        <nav className="flex flex-col gap-0.5">
          {NAV.map((item, i) => {
            if (item.type === "section") {
              return (
                <div key={i} className="mt-4 mb-1 px-3">
                  <span style={{ fontSize: 9, color: "#555", letterSpacing: 2, fontWeight: 700 }}>{item.label}</span>
                </div>
              )
            }
            const active = pathname === item.href
            const isSub = item.type === "sub"
            return (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: active ? "#E8421A" : "transparent",
                  color: active ? "#fff" : isSub ? "#666" : "#999",
                  borderRadius: 8,
                  paddingLeft: isSub ? 28 : 12,
                  fontSize: isSub ? 11 : 12,
                }}
              >
                {!isSub && "icon" in item && <span style={{ fontSize: 13 }}>{item.icon}</span>}
                {isSub && <span style={{ color: "#444", fontSize: 10 }}>↳</span>}
                {item.label}
              </a>
            )
          })}
        </nav>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: "/backoffice/login" })}
        className="flex items-center gap-2 px-3 py-2 text-xs font-medium transition-all"
        style={{ color: "#555", borderRadius: 8 }}
      >
        ← Sair
      </button>
    </aside>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === "/backoffice/login"

  if (isLogin) {
    return <>{children}</>
  }

  return (
    <SessionProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8" style={{ marginLeft: 220, background: "#F8F8F8" }}>
          {children}
        </main>
      </div>
    </SessionProvider>
  )
}
