'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const PUBLIC_NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Ranking', href: '/ranking' },
  { label: 'Mercado', href: '/mercado' },
  { label: 'Notícias', href: '/noticias' },
] as const

interface PublicMobileNavProps {
  onClose: () => void
  darkMode?: boolean
}

export function PublicMobileNav({
  onClose,
  darkMode = false,
}: PublicMobileNavProps) {
  const pathname = usePathname()
  const textColor = darkMode ? 'text-white' : 'text-[#171726]'

  return (
    <nav className="container mx-auto py-4 flex flex-col gap-2 px-4">
      {PUBLIC_NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClose}
          className={`px-4 py-3 rounded-lg text-base font-medium transition-colors ${
            pathname === item.href
              ? 'text-primary'
              : `${textColor} hover:text-primary`
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
