'use client'

import FranchisorFranchiseSelect from '@/src/components/franchisors/FranchisorFranchiseSelect'
import { useFranchisorFranchisesQuery } from '@/src/hooks/franchises/useFranchises'
import { useAuth } from '@/src/hooks/users/useAuth'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect } from 'react'

interface FranchisorDesktopNavigationProps {
  darkMode?: boolean
}

export const FranchisorDesktopNavigation = ({
  darkMode = false,
}: FranchisorDesktopNavigationProps) => {
  const { payload, token } = useAuth()
  const pathname = usePathname()
  const [selectedFranchiseId, setSelectedFranchiseId] = useQueryState(
    'franchise',
    parseAsString.withDefault(''),
  )

  const { franchises, isLoading: isLoadingFranchises } =
    useFranchisorFranchisesQuery(payload?.id || '', token || undefined)

  useEffect(() => {
    if (franchises.length > 0) {
      if (
        !selectedFranchiseId ||
        !franchises.find((f) => f.slug === selectedFranchiseId)
      ) {
        setSelectedFranchiseId(franchises[0].slug)
      }
    }
  }, [franchises, selectedFranchiseId, setSelectedFranchiseId])

  const handleFranchiseChange = (franchiseId: string) => {
    setSelectedFranchiseId(franchiseId)
  }

  const isHomeActive = pathname === '/franqueador'
  const isMyFranchisesActive = pathname.includes('/minhas-franquias')
  const textColor = darkMode ? 'text-white' : 'text-[#171726]'
  const hoverColor = darkMode ? 'hover:text-primary' : 'hover:text-primary'
  const pillBgClass = darkMode ? 'bg-white/10' : 'bg-secondary'
  const pillTextClass = darkMode ? 'text-white' : 'text-foreground'
  const mutedTextClass = darkMode ? 'text-white/70' : 'text-muted-foreground'

  return (
    <nav className="hidden md:flex items-center gap-1">
      <Link
        href="/franqueador"
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
          isHomeActive ? 'text-primary' : `${textColor} ${hoverColor}`
        }`}
      >
        Home
      </Link>

      <Link
        href="/franqueador/minhas-franquias"
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
          isMyFranchisesActive ? 'text-primary' : `${textColor} ${hoverColor}`
        }`}
      >
        Minhas Franquias
      </Link>

      {!isLoadingFranchises && franchises.length > 1 && (
        <div className="ml-4 w-[260px]">
          <FranchisorFranchiseSelect
            value={selectedFranchiseId}
            onChange={handleFranchiseChange}
            options={franchises.map((f) => ({
              value: f.slug,
              label: f.name,
              logoUrl: f.logoUrl,
            }))}
          />
        </div>
      )}

      {!isLoadingFranchises && franchises.length === 1 && (
        <div
          className={`flex items-center gap-2 ml-4 px-4 py-2 ${pillBgClass} rounded-full`}
        >
          {franchises[0].logoUrl && (
            <Image
              src={franchises[0].logoUrl}
              alt={franchises[0].name}
              width={24}
              height={24}
              className="rounded-full object-cover"
            />
          )}
          <span className={`text-sm font-medium ${pillTextClass}`}>
            {franchises[0].name}
          </span>
        </div>
      )}

      {isLoadingFranchises && (
        <div
          className={`flex items-center gap-2 ml-4 px-4 py-2 ${pillBgClass} rounded-full`}
        >
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary/20"></div>
          <span className={`text-sm font-medium ${mutedTextClass}`}>
            Carregando...
          </span>
        </div>
      )}
    </nav>
  )
}
