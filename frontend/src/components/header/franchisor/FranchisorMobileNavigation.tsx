'use client'

import FranchisorFranchiseSelect from '@/src/components/franchisors/FranchisorFranchiseSelect'
import LogoutIcon from '@/src/components/icons/logoutIcon'
import { useFranchisorFranchisesQuery } from '@/src/hooks/franchises/useFranchises'
import { useAuth } from '@/src/hooks/users/useAuth'
import { removeClientAuthCookie } from '@/src/utils/clientCookie'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface FranchisorMobileNavigationProps {
  handleMobileMenuClose: () => void
  darkMode?: boolean
}

export const FranchisorMobileNavigation = ({
  handleMobileMenuClose,
  darkMode = false,
}: FranchisorMobileNavigationProps) => {
  const { payload, token } = useAuth()
  const pathname = usePathname()
  const [selectedFranchiseId, setSelectedFranchiseId] = useQueryState(
    'franchise',
    parseAsString.withDefault(''),
  )
  const [isLoggingOut, setIsLoggingOut] = useState(false)

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

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      removeClientAuthCookie()
      toast.success('Logout realizado com sucesso!')

      setTimeout(() => {
        window.location.href = '/'
      }, 1500)
    } catch (error) {
      console.error('Erro ao fazer logout: ', error)
      toast.error('Erro ao fazer o Logout')
      setIsLoggingOut(false)
    }
  }

  const isHomeActive = pathname === '/franqueador'
  const isMyFranchisesActive = pathname.includes('/minhas-franquias')

  const textColor = darkMode ? 'text-white' : 'text-foreground'
  const mutedTextColor = darkMode ? 'text-white/70' : 'text-muted-foreground'
  const inactiveLinkClass = darkMode
    ? 'text-white/70 hover:text-white hover:bg-white/10'
    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
  const hoverBgClass = darkMode ? 'hover:bg-white/10' : 'hover:bg-secondary'
  const bgClass = darkMode ? 'bg-black' : 'bg-background'

  return (
    <div
      className={`md:hidden border-t border-border ${bgClass} h-[calc(100vh-64px)] overflow-y-auto`}
    >
      <nav className="container mx-auto py-4 flex flex-col gap-2 px-4">
        <Link
          href="/franqueador"
          onClick={handleMobileMenuClose}
          className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            isHomeActive ? 'bg-primary text-white' : inactiveLinkClass
          }`}
        >
          Home
        </Link>

        <Link
          href="/franqueador/minhas-franquias"
          onClick={handleMobileMenuClose}
          className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            isMyFranchisesActive ? 'bg-primary text-white' : inactiveLinkClass
          }`}
        >
          Minhas Franquias
        </Link>

        {!isLoadingFranchises && franchises.length > 1 && (
          <div className="mt-2">
            <FranchisorFranchiseSelect
              value={selectedFranchiseId}
              onChange={(id) => handleFranchiseChange(id)}
              options={franchises.map((f) => ({
                value: f.slug,
                label: f.name,
                logoUrl: f.logoUrl,
              }))}
            />
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-border flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className={`text-sm font-medium truncate ${textColor}`}>
                {payload?.name || 'Franqueador'}
              </div>
              <div className={`text-xs ${mutedTextColor}`}>Franqueador</div>
            </div>
            <button
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isLoggingOut
                  ? 'cursor-not-allowed opacity-50'
                  : `cursor-pointer ${hoverBgClass}`
              }`}
              onClick={handleLogout}
              disabled={isLoggingOut}
              aria-label="Sair"
            >
              <LogoutIcon width={24} height={24} />
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}
