'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import EmojiIcon from '@/src/components/icons/emojiIcon'
import { AdminMobileActions } from './AdminMobileActions'

interface AdminMobileNavigationProps {
  isMobileMenuOpen: boolean
  isMobileUsersDropdown: boolean
  setIsMobileUsersDropdown: (value: boolean) => void
  handleMobileMenuClose: () => void
}

export const AdminMobileNavigation = ({
  isMobileMenuOpen,
  isMobileUsersDropdown,
  setIsMobileUsersDropdown,
  handleMobileMenuClose,
}: AdminMobileNavigationProps) => {
  const pathname = usePathname()

  const isHomeActive = pathname === '/admin'
  const isUsersActive =
    pathname === '/admin/franqueados' ||
    pathname === '/admin/administradores' ||
    pathname === '/admin/franqueadores'
  const isNewsActive = pathname === '/admin/noticias'
  const isFranchisesActive =
    pathname === '/admin/franquias' ||
    pathname === '/admin/patrocinados' ||
    pathname === '/admin/big-numbers'
  const isAbfSegmentsActive = pathname === '/admin/segmentos-abf'

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 bg-opacity-50 z-40 md:hidden"
        onClick={handleMobileMenuClose}
      />

      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white transition-transform duration-300 ease-in-out z-50 md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
              <EmojiIcon color="#E25E3E" />
            </div>
            <div>
              <p className="font-medium text-sm text-foreground">Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-col p-6 space-y-2">
          <Link
            href="/admin"
            className={`p-3 rounded-lg transition-colors ${
              isHomeActive
                ? 'bg-secondary font-semibold text-primary'
                : 'hover:bg-secondary/50 text-foreground'
            }`}
            onClick={handleMobileMenuClose}
          >
            Home
          </Link>

          <div>
            <button
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                isUsersActive
                  ? 'bg-secondary font-semibold text-primary'
                  : 'hover:bg-secondary/50 text-foreground'
              }`}
              onClick={() => setIsMobileUsersDropdown(!isMobileUsersDropdown)}
            >
              Usuários {isMobileUsersDropdown ? '▼' : '▶'}
            </button>
            {isMobileUsersDropdown && (
              <div className="ml-4 mt-2 space-y-1">
                <Link
                  href="/admin/administradores"
                  className={`block p-2 rounded-lg transition-colors ${
                    pathname === '/admin/administradores'
                      ? 'bg-secondary font-semibold text-primary'
                      : 'hover:bg-secondary/50 text-foreground'
                  }`}
                  onClick={handleMobileMenuClose}
                >
                  Administradores
                </Link>
                <Link
                  href="/admin/franqueadores"
                  className={`block p-2 rounded-lg transition-colors ${
                    pathname === '/admin/franqueadores'
                      ? 'bg-secondary font-semibold text-primary'
                      : 'hover:bg-secondary/50 text-foreground'
                  }`}
                  onClick={handleMobileMenuClose}
                >
                  Franqueadores
                </Link>
                <Link
                  href="/admin/franqueados"
                  className={`block p-2 rounded-lg transition-colors ${
                    pathname === '/admin/franqueados'
                      ? 'bg-secondary font-semibold text-primary'
                      : 'hover:bg-secondary/50 text-foreground'
                  }`}
                  onClick={handleMobileMenuClose}
                >
                  Membros
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/admin/franquias"
            className={`p-3 rounded-lg transition-colors ${
              isFranchisesActive
                ? 'bg-secondary font-semibold text-primary'
                : 'hover:bg-secondary/50 text-foreground'
            }`}
            onClick={handleMobileMenuClose}
          >
            Franquias
          </Link>

          <Link
            href="/admin/noticias"
            className={`p-3 rounded-lg transition-colors ${
              isNewsActive
                ? 'bg-secondary font-semibold text-primary'
                : 'hover:bg-secondary/50 text-foreground'
            }`}
            onClick={handleMobileMenuClose}
          >
            Notícias
          </Link>

          <Link
            href="/admin/segmentos-abf"
            className={`p-3 rounded-lg transition-colors ${
              isAbfSegmentsActive
                ? 'bg-secondary font-semibold text-primary'
                : 'hover:bg-secondary/50 text-foreground'
            }`}
            onClick={handleMobileMenuClose}
          >
            Segmentos ABF
          </Link>
        </nav>

        <AdminMobileActions handleMobileMenuClose={handleMobileMenuClose} />
      </div>
    </>
  )
}
