"use client"

import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { SessionProvider } from "next-auth/react"

const BG_SIDEBAR = "#1a1a18"
const BG_CONTENT = "#f4f3ef"
const COR_PRIMARIA = "#1D9E75"

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "◉" },
  { href: "/admin/relatorios", label: "Relatorios", icon: "◫" },
  { href: "/admin/upload", label: "Upload PDF", icon: "↑" },
  { href: "/admin/fontes", label: "Fontes", icon: "◎" },
  { href: "/admin/logs", label: "Logs", icon: "≡" },
  { href: "/admin/auditoria", label: "Auditoria", icon: "✓" },
]

function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col justify-between py-6 px-4"
      style={{ width: 220, background: BG_SIDEBAR }}
    >
      <div>
        <div className="mb-8 px-2">
          <p className="text-xs uppercase tracking-widest" style={{ color: COR_PRIMARIA }}>
            Franquias
          </p>
          <p className="text-sm font-medium text-white">Intelligence</p>
          <p className="text-[10px] mt-0.5" style={{ color: "#666" }}>
            Backoffice
          </p>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href
            return (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: active ? "rgba(29,158,117,0.12)" : "transparent",
                  color: active ? COR_PRIMARIA : "#888",
                }}
              >
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                {item.label}
              </a>
            )
          })}
        </nav>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: "/admin/login" })}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
        style={{ color: "#666" }}
      >
        ← Sair
      </button>
    </aside>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === "/admin/login"

  if (isLogin) {
    return <>{children}</>
  }

  return (
    <SessionProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8" style={{ marginLeft: 220, background: BG_CONTENT }}>
          {children}
        </main>
      </div>
    </SessionProvider>
  )
}
