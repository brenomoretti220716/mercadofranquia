'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const PUBLIC_NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Ranking', href: '/ranking' },
  { label: 'Mercado', href: '/mercado' },
  { label: 'Notícias', href: '/noticias' },
] as const

interface PublicDesktopNavProps {
  darkMode?: boolean
}

export function PublicDesktopNav({ darkMode = false }: PublicDesktopNavProps) {
  const pathname = usePathname()
  const textColor = darkMode ? 'text-white' : 'text-[#171726]'
  const hoverColor = darkMode ? 'hover:text-primary' : 'hover:text-primary'

  return (
    <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
      {PUBLIC_NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            pathname === item.href
              ? 'text-primary'
              : `${textColor} ${hoverColor}`
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
