'use client'

import EmojiIcon from '@/src/components/icons/emojiIcon'
import NotificationButton from '@/src/components/notifications/NotificationButton'
import Skeleton from '@/src/components/ui/skeletons/Skeleton'
import { useAuth } from '@/src/hooks/users/useAuth'
import { removeClientAuthCookie } from '@/src/utils/clientCookie'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

interface FranchisorDesktopActionsProps {
  profileDropdownRef: React.RefObject<HTMLDivElement | null>
  isProfileDropdown: boolean
  setIsProfileDropdown: React.Dispatch<React.SetStateAction<boolean>>
  darkMode?: boolean
}

export const FranchisorDesktopActions = ({
  profileDropdownRef,
  isProfileDropdown,
  setIsProfileDropdown,
  darkMode = false,
}: FranchisorDesktopActionsProps) => {
  const { payload, isValidating } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const textColor = darkMode ? 'text-white' : 'text-foreground'
  const mutedTextColor = darkMode ? 'text-white/70' : 'text-muted-foreground'
  const hoverBgClass = darkMode ? 'hover:bg-white/10' : 'hover:bg-secondary'

  const handleProfileDropdownToggle = () => {
    setIsProfileDropdown((prev: boolean) => !prev)
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

  return (
    <div className="hidden md:flex gap-5 items-center">
      <div>
        <h2
          className={`font-semibold max-w-[15vw] truncate ${textColor}`}
          title={payload?.name}
        >
          {payload?.name}
        </h2>
        <h3 className={`text-xs flex justify-end ${mutedTextColor}`}>
          Franqueador
        </h3>
      </div>
      <div>
        {isValidating ? (
          <div className="relative lg:w-50 flex justify-center items-center">
            <Skeleton className="w-12 h-8 rounded-md" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <NotificationButton iconColor="#E25E3E" iconSize={24} />

            <div
              className="relative flex justify-center items-center"
              ref={profileDropdownRef}
            >
              <div
                className={`w-10 h-10 rounded-full flex flex-col items-center justify-center cursor-pointer transition-colors ${hoverBgClass}`}
                onClick={handleProfileDropdownToggle}
              >
                <EmojiIcon color="#E25E3E" />
              </div>

              {isProfileDropdown && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-border z-50">
                  <Link
                    href="/"
                    className="block w-full text-left px-4 py-3 hover:bg-secondary first:rounded-t-lg transition-colors text-foreground cursor-pointer"
                  >
                    Painel de Início
                  </Link>
                  <Link
                    href="/perfil"
                    className="block w-full text-left px-4 py-3 hover:bg-secondary transition-colors text-foreground cursor-pointer"
                  >
                    Perfil
                  </Link>
                  <Link
                    href="/favoritos"
                    className="block w-full text-left px-4 py-3 hover:bg-secondary transition-colors text-foreground cursor-pointer"
                  >
                    Favoritos
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full text-left px-4 py-3 hover:bg-secondary last:rounded-b-lg transition-colors text-foreground cursor-pointer"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
