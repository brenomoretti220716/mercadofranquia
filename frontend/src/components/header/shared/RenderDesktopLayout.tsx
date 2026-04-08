import EmojiIcon from '@/src/components/icons/emojiIcon'
import NotificationButton from '@/src/components/notifications/NotificationButton'
import { AuthContext } from '@/src/contexts/AuthContext'
import { useLogout } from '@/src/hooks/users/useAuth'
import Link from 'next/link'
import { useContext } from 'react'

interface RenderDesktopLayoutProps {
  dropdownRef: React.RefObject<HTMLDivElement | null>
  handleDropdownToggle: () => void
  isDropdownOpen: boolean
}

export const RenderDesktopLayout = ({
  dropdownRef,
  handleDropdownToggle,
  isDropdownOpen,
}: RenderDesktopLayoutProps) => {
  const { isLoggingOut, handleLogout } = useLogout()
  const { payload } = useContext(AuthContext)

  switch (payload?.role) {
    case 'FRANCHISEE':
    case 'CANDIDATE':
    case 'ENTHUSIAST':
    case 'MEMBER':
      return (
        <div className="flex items-center gap-2">
          <NotificationButton iconColor="#E25E3E" iconSize={24} />

          <div
            className="relative flex justify-center items-center"
            ref={dropdownRef}
          >
            <div
              className="w-10 h-10 rounded-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors"
              onClick={handleDropdownToggle}
            >
              <EmojiIcon color="#E25E3E" />
            </div>

            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50">
                <Link
                  href="/favoritos"
                  className="block w-full text-left px-4 py-3 hover:bg-gray-50 first:rounded-t-lg transition-colors text-gray-700 cursor-pointer"
                >
                  Favoritos
                </Link>
                <Link
                  href="/perfil"
                  className="block w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 cursor-pointer"
                >
                  Perfil
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 last:rounded-b-lg transition-colors text-gray-700 cursor-pointer"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      )

    case 'FRANCHISOR':
      return (
        <div className="flex items-center gap-2">
          <NotificationButton iconColor="#E25E3E" iconSize={24} />

          <div
            className="relative flex justify-center items-center"
            ref={dropdownRef}
          >
            <div
              className="w-10 h-10 rounded-full flex flex-col items-center justify-center cursor-pointer hover:bg-secondary transition-colors"
              onClick={handleDropdownToggle}
            >
              <EmojiIcon color="#E25E3E" />
            </div>

            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50">
                <Link
                  href="/franqueador"
                  className="block w-full text-left px-4 py-3 hover:bg-gray-50 first:rounded-t-lg transition-colors text-gray-700 cursor-pointer"
                >
                  Minhas Franquias
                </Link>
                <Link
                  href="/favoritos"
                  className="block w-full text-left px-4 py-3 hover:bg-gray-50 first:rounded-t-lg transition-colors text-gray-700 cursor-pointer"
                >
                  Favoritos
                </Link>
                <Link
                  href="/perfil"
                  className="block w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 cursor-pointer"
                >
                  Perfil
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 last:rounded-b-lg transition-colors text-gray-700 cursor-pointer"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      )

    case 'ADMIN':
      return (
        <div className="flex items-center gap-2">
          <NotificationButton iconColor="#E25E3E" iconSize={24} />

          <div
            className="relative flex justify-center items-center"
            ref={dropdownRef}
          >
            <div
              className="w-10 h-10 rounded-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors"
              onClick={handleDropdownToggle}
            >
              <EmojiIcon color="#E25E3E" />
            </div>

            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50">
                <Link
                  href="/admin"
                  className="block w-full text-left px-4 py-3 hover:bg-gray-50 first:rounded-t-lg transition-colors text-gray-700 cursor-pointer"
                >
                  Painel de Controle
                </Link>
                <Link
                  href="/favoritos"
                  className="block w-full text-left px-4 py-3 hover:bg-gray-50 first:rounded-t-lg transition-colors text-gray-700 cursor-pointer"
                >
                  Favoritos
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 last:rounded-b-lg transition-colors text-gray-700 cursor-pointer"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      )

    default:
      return null
  }
}
