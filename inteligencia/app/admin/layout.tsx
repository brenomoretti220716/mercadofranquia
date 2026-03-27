"use client"

import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { SessionProvider } from "next-auth/react"

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard Admin", icon: "◉" },
  { href: "/admin/dashboard-dados", label: "Dashboard Dados", icon: "◈" },
  { href: "/admin/relatorios", label: "Relatorios ABF", icon: "◫" },
  { href: "/admin/upload", label: "Upload PDF", icon: "↑" },
  { href: "/admin/franquias", label: "Franquias", icon: "▣" },
  { href: "/admin/fontes", label: "Fontes", icon: "◎" },
  { href: "/admin/logs", label: "Logs", icon: "≡" },
  { href: "/admin/auditoria", label: "Auditoria", icon: "✓" },
]

function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col justify-between py-6 px-4"
      style={{ width: 220, background: "#0D0D0D" }}
    >
      <div>
        <div className="mb-8 px-2">
          <p className="text-sm font-bold text-white">
            Mercado <span style={{ color: "#E8421A" }}>Franquia</span>
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: "#555" }}>
            Intelligence Backoffice
          </p>
        </div>

        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href
            return (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-xs font-medium transition-all"
                style={{
                  background: active ? "#E8421A" : "transparent",
                  color: active ? "#fff" : "#999",
                  borderRadius: 8,
                }}
              >
                <span style={{ fontSize: 13 }}>{item.icon}</span>
                {item.label}
              </a>
            )
          })}
        </nav>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: "/admin/login" })}
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
  const isLogin = pathname === "/admin/login"

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
