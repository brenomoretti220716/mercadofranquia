'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface MinimalDesktopNavProps {
  darkMode?: boolean
}

export function MinimalDesktopNav({
  darkMode = false,
}: MinimalDesktopNavProps) {
  const pathname = usePathname()
  const isLoginActive = pathname === '/login'
  const isRegistroActive = pathname === '/cadastro'
  const textColor = darkMode ? 'text-white' : 'text-[#171726]'
  const hoverColor = darkMode ? 'hover:text-primary' : 'hover:text-primary'

  return (
    <nav className="flex items-center gap-1">
      <Link
        href="/login"
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          isLoginActive ? 'text-primary' : `${textColor} ${hoverColor}`
        }`}
      >
        Login
      </Link>
      <Link
        href="/cadastro"
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          isRegistroActive ? 'text-primary' : `${textColor} ${hoverColor}`
        }`}
      >
        Cadastro
      </Link>
    </nav>
  )
}
