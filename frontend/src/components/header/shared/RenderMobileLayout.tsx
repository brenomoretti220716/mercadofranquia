import { AuthContext } from '@/src/contexts/AuthContext'
import { useLogout } from '@/src/hooks/users/useAuth'
import EmojiIcon from '@/src/components/icons/emojiIcon'
import Link from 'next/link'
import { useContext } from 'react'

interface RenderMobileLayoutProps {
  handleMobileMenuClose: () => void
  darkMode?: boolean
}

export const RenderMobileLayout = ({
  handleMobileMenuClose,
  darkMode = false,
}: RenderMobileLayoutProps) => {
  const { payload } = useContext(AuthContext)
  const { handleLogout } = useLogout()

  const linkClassName = `block w-full text-left p-3 rounded-lg transition-colors text-base ${
    darkMode
      ? 'text-white/90 hover:bg-white/10'
      : 'text-[#171726] hover:bg-gray-100'
  }`

  const logoutButtonClassName = `w-full text-left p-3 rounded-lg transition-colors text-base ${
    darkMode
      ? 'hover:bg-white/10 text-red-400'
      : 'hover:bg-gray-100 text-red-600'
  }`

  const userNameClassName = `font-medium text-lg ${
    darkMode ? 'text-white/90' : 'text-[#171726]'
  }`

  const userEmailClassName = `text-base ${darkMode ? 'text-white/60' : 'text-gray-500'}`

  switch (payload?.role) {
    case 'FRANCHISEE':
    case 'CANDIDATE':
    case 'ENTHUSIAST':
    case 'MEMBER':
      return (
        <div className="space-y-3">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <EmojiIcon />
            </div>
            <div>
              <p className={userNameClassName}>{payload?.name}</p>
              <p className={userEmailClassName}>{payload?.email}</p>
            </div>
          </div>
          <Link
            href="/favoritos"
            className={linkClassName}
            onClick={handleMobileMenuClose}
          >
            Favoritos
          </Link>
          <Link
            href="/perfil"
            className={linkClassName}
            onClick={handleMobileMenuClose}
          >
            Perfil
          </Link>
          <button onClick={handleLogout} className={logoutButtonClassName}>
            Sair
          </button>
        </div>
      )
    case 'ADMIN':
      return (
        <div className="space-y-3">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <EmojiIcon />
            </div>
            <div>
              <p className={userNameClassName}>{payload?.name}</p>
              <p className={userEmailClassName}>{payload?.email}</p>
            </div>
          </div>
          <Link
            href="/admin"
            className={linkClassName}
            onClick={handleMobileMenuClose}
          >
            Painel de Controle
          </Link>
          <Link
            href="/favoritos"
            className={linkClassName}
            onClick={handleMobileMenuClose}
          >
            Perfil
          </Link>
          <button onClick={handleLogout} className={logoutButtonClassName}>
            Sair
          </button>
        </div>
      )

    case 'FRANCHISOR':
      return (
        <div className="space-y-3">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <EmojiIcon />
            </div>
            <div>
              <p className={userNameClassName}>{payload?.name}</p>
              <p className={userEmailClassName}>{payload?.email}</p>
            </div>
          </div>
          <Link
            href="/franqueador"
            className={linkClassName}
            onClick={handleMobileMenuClose}
          >
            Minhas Franquias
          </Link>
          <Link
            href="/favoritos"
            className={linkClassName}
            onClick={handleMobileMenuClose}
          >
            Favoritos
          </Link>
          <Link
            href="/perfil"
            className={linkClassName}
            onClick={handleMobileMenuClose}
          >
            Perfil
          </Link>
          <button onClick={handleLogout} className={logoutButtonClassName}>
            Sair
          </button>
        </div>
      )

    default:
      return null
  }
}
