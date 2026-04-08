'use client'

import RoundedButton from '@/src/components/ui/RoundedButton'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AdminDesktopNavigationProps {
  darkMode?: boolean
  isUsersDropdown: boolean
  setIsUsersDropdown: React.Dispatch<React.SetStateAction<boolean>>
  dropdownRef: React.RefObject<HTMLDivElement | null>
}

export const AdminDesktopNavigation = ({
  darkMode = false,
  isUsersDropdown,
  setIsUsersDropdown,
  dropdownRef,
}: AdminDesktopNavigationProps) => {
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

  const handleDropdownToggle = () => {
    setIsUsersDropdown((prev) => !prev)
  }

  const textColor = darkMode ? 'white' : '#171726'

  const navButtonClass = '!text-sm'
  return (
    <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1">
      <Link href="/admin">
        <RoundedButton
          text="Home"
          color="transparent"
          textColor={isHomeActive ? '#E25E3E' : textColor}
          hoverColor="transparent"
          hoverTextColor="#E25E3E"
          className={navButtonClass}
        />
      </Link>

      <div className="relative" ref={dropdownRef}>
        <div onClick={handleDropdownToggle}>
          <RoundedButton
            text="Usuários"
            color="transparent"
            textColor={isUsersActive ? '#E25E3E' : textColor}
            hoverColor="transparent"
            hoverTextColor="#E25E3E"
            className={navButtonClass}
          />
        </div>

        {isUsersDropdown && (
          <div className="absolute top-full left-0 mt-2 w-48 rounded-md bg-white shadow-lg border border-border z-10">
            <Link
              href="/admin/administradores"
              onClick={() => setIsUsersDropdown(false)}
            >
              <button
                className={`w-full text-left px-4 py-3 first:rounded-t-md last:rounded-b-md hover:bg-secondary transition-colors ${
                  pathname === '/admin/administradores'
                    ? 'bg-secondary text-primary font-medium'
                    : 'text-foreground'
                }`}
              >
                Administradores
              </button>
            </Link>
            <Link
              href="/admin/franqueadores"
              onClick={() => setIsUsersDropdown(false)}
            >
              <button
                className={`w-full text-left px-4 py-3 first:rounded-t-md last:rounded-b-md hover:bg-secondary transition-colors ${
                  pathname === '/admin/franqueadores'
                    ? 'bg-secondary text-primary font-medium'
                    : 'text-foreground'
                }`}
              >
                Franqueadores
              </button>
            </Link>
            <Link
              href="/admin/franqueados"
              onClick={() => setIsUsersDropdown(false)}
            >
              <button
                className={`w-full text-left px-4 py-3 first:rounded-t-md last:rounded-b-md hover:bg-secondary transition-colors ${
                  pathname === '/admin/franqueados'
                    ? 'bg-secondary text-primary font-medium'
                    : 'text-foreground'
                }`}
              >
                Membros
              </button>
            </Link>
          </div>
        )}
      </div>

      <Link href="/admin/franquias">
        <RoundedButton
          text="Franquias"
          color="transparent"
          textColor={isFranchisesActive ? '#E25E3E' : textColor}
          hoverColor="transparent"
          hoverTextColor="#E25E3E"
          className={navButtonClass}
        />
      </Link>

      <Link href="/admin/noticias">
        <RoundedButton
          text="Notícias"
          color="transparent"
          textColor={isNewsActive ? '#E25E3E' : textColor}
          hoverColor="transparent"
          hoverTextColor="#E25E3E"
          className={navButtonClass}
        />
      </Link>

      <Link href="/admin/segmentos-abf">
        <RoundedButton
          text="Segmentos ABF"
          color="transparent"
          textColor={isAbfSegmentsActive ? '#E25E3E' : textColor}
          hoverColor="transparent"
          hoverTextColor="#E25E3E"
          className={navButtonClass}
        />
      </Link>
    </nav>
  )
}
