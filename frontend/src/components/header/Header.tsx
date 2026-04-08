'use client'

import CloseIcon from '@/src/components/icons/closeIcon'
import LogoHeader from '@/src/components/ui/LogoHeader'
import { AuthContext } from '@/src/contexts/AuthContext'
import Link from 'next/link'
import { Suspense, useContext, useEffect, useRef, useState } from 'react'
import { AdminDesktopNavigation } from './admin/AdminDesktopNavigation'
import { AdminMobileNavigation } from './admin/AdminMobileNavigation'
import { FranchisorDesktopNavigation } from './franchisor/FranchisorDesktopNavigation'
import { FranchisorMobileNavigation } from './franchisor/FranchisorMobileNavigation'
import { HeaderRightActions, HeaderVariant } from './HeaderRightActions'
import { PublicDesktopNav } from './public/PublicDesktopNav'
import { PublicMobileNav } from './public/PublicMobileNav'
import { RenderMobileLayout } from './shared/RenderMobileLayout'

interface HeaderProps {
  variant?: HeaderVariant
  darkMode?: boolean
}

function HeaderContent({
  variant = 'public',
  // Default to black header styling; ensures the paired logo variant is used.
  darkMode = true,
}: HeaderProps) {
  const { payload, isAuthenticated } = useContext(AuthContext)
  const isLoggedIn = isAuthenticated

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isUsersDropdown, setIsUsersDropdown] = useState(false)
  const [isMobileUsersDropdown, setIsMobileUsersDropdown] = useState(false)
  const [isProfileDropdown, setIsProfileDropdown] = useState(false)

  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const profileDropdownRef = useRef<HTMLDivElement | null>(null)

  const handleDropdownToggle = () => setIsDropdownOpen((prev) => !prev)
  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false)
    setIsMobileUsersDropdown(false)
  }

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (mobileMenuOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        variant === 'public' &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsDropdownOpen(false)
      }
      if (
        variant === 'admin' &&
        isUsersDropdown &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsUsersDropdown(false)
      }
      if (
        (variant === 'admin' || variant === 'franchisor') &&
        isProfileDropdown &&
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(target)
      ) {
        setIsProfileDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [variant, isUsersDropdown, isProfileDropdown])

  const showMobileMenuButton = variant !== 'minimal' && variant !== 'admin'
  const containerClass =
    variant === 'franchisor'
      ? 'container mx-auto px-4 md:px-10 flex h-16 items-center justify-between'
      : 'container mx-auto px-4 flex h-16 items-center justify-between gap-4 relative'

  const headerBgClass = darkMode
    ? 'bg-black border-b border-[#6B7280]'
    : 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border'
  const textColorClass = darkMode ? 'text-white' : 'text-[#171726]'

  const mobileMenuButtonTextClass = darkMode ? 'text-white' : 'text-foreground'
  const mobileHamburgerLineBgClass = darkMode ? 'bg-white' : 'bg-foreground'
  const publicMobileMenuPanelClass = darkMode
    ? 'border-t border-[#6B7280] bg-black'
    : 'border-t border-border bg-background'

  return (
    <>
      <header className={`sticky top-0 z-50 ${headerBgClass}`}>
        <div className={`${containerClass} ${textColorClass}`}>
          {variant === 'admin' && (
            <button
              className="md:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1 flex-shrink-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              <span
                className={`block w-6 h-0.5 ${mobileHamburgerLineBgClass} transition-transform duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}
              />
              <span
                className={`block w-6 h-0.5 ${mobileHamburgerLineBgClass} transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}
              />
              <span
                className={`block w-6 h-0.5 ${mobileHamburgerLineBgClass} transition-transform duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}
              />
            </button>
          )}

          <LogoHeader dark={!darkMode} />

          {variant === 'public' && <PublicDesktopNav darkMode={darkMode} />}
          {variant === 'admin' && (
            <AdminDesktopNavigation
              darkMode={darkMode}
              isUsersDropdown={isUsersDropdown}
              setIsUsersDropdown={setIsUsersDropdown}
              dropdownRef={dropdownRef}
            />
          )}
          {variant === 'franchisor' && (
            <FranchisorDesktopNavigation darkMode={darkMode} />
          )}

          {variant === 'minimal' && (
            <HeaderRightActions variant="minimal" darkMode={darkMode} />
          )}
          {variant === 'public' && (
            <HeaderRightActions
              payload={payload}
              variant="public"
              darkMode={darkMode}
              isAuthenticated={isAuthenticated}
              dropdownRef={dropdownRef}
              isDropdownOpen={isDropdownOpen}
              onDropdownToggle={handleDropdownToggle}
            />
          )}
          {variant === 'admin' && (
            <HeaderRightActions
              payload={payload}
              variant="admin"
              darkMode={darkMode}
              profileDropdownRef={profileDropdownRef}
              isProfileDropdown={isProfileDropdown}
              setIsProfileDropdown={setIsProfileDropdown}
            />
          )}
          {variant === 'franchisor' && (
            <HeaderRightActions
              payload={payload}
              variant="franchisor"
              darkMode={darkMode}
              profileDropdownRef={profileDropdownRef}
              isProfileDropdown={isProfileDropdown}
              setIsProfileDropdown={setIsProfileDropdown}
            />
          )}

          {showMobileMenuButton && (
            <button
              className={`md:hidden p-2 ${mobileMenuButtonTextClass} flex-shrink-0`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <CloseIcon width={24} height={24} />
              ) : (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          )}
        </div>
      </header>

      {variant === 'public' && mobileMenuOpen && (
        <div
          className={`md:hidden fixed inset-x-0 top-16 z-40 h-[calc(100vh-64px)] overflow-y-auto ${publicMobileMenuPanelClass}`}
        >
          <PublicMobileNav
            darkMode={darkMode}
            onClose={() => setMobileMenuOpen(false)}
          />
          <div className="container mx-auto px-4 mt-4 pt-4 border-t border-border flex flex-col gap-4 pb-4">
            {!isLoggedIn && (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full px-4 py-3 rounded-lg text-base font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary">
                    Login
                  </button>
                </Link>
                <Link href="/cadastro" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full bg-primary hover:bg-coral-dark text-white p-3 rounded-md font-medium transition-colors text-base">
                    Cadastra-se
                  </button>
                </Link>
              </>
            )}
            {isLoggedIn && (
              <RenderMobileLayout
                handleMobileMenuClose={() => setMobileMenuOpen(false)}
                darkMode={darkMode}
              />
            )}
          </div>
        </div>
      )}

      {variant === 'admin' && mobileMenuOpen && (
        <AdminMobileNavigation
          isMobileMenuOpen={mobileMenuOpen}
          isMobileUsersDropdown={isMobileUsersDropdown}
          setIsMobileUsersDropdown={setIsMobileUsersDropdown}
          handleMobileMenuClose={handleMobileMenuClose}
        />
      )}

      {variant === 'franchisor' && mobileMenuOpen && (
        <FranchisorMobileNavigation
          darkMode={darkMode}
          handleMobileMenuClose={() => setMobileMenuOpen(false)}
        />
      )}

      {variant === 'minimal' && null}
    </>
  )
}

function FranchisorHeaderFallback() {
  return (
    <header className="sticky top-0 z-50 bg-black border-b border-[#6B7280]">
      <div className="container mx-auto px-4 md:px-10 flex h-16 items-center justify-between text-white">
        <LogoHeader />
        <nav className="flex gap-1 items-center">
          <div className="flex items-center gap-2 ml-4 px-4 py-2 bg-secondary rounded-full">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary/20" />
            <span className="text-sm text-white/80">Carregando...</span>
          </div>
        </nav>
        <div className="flex gap-5 items-center">
          <div>
            <h2 className="font-semibold max-w-[15vw] truncate text-white">
              Carregando...
            </h2>
            <h3 className="text-xs flex justify-end text-white/70">
              Franqueador
            </h3>
          </div>
        </div>
      </div>
    </header>
  )
}

export default function Header({
  variant = 'public',
  darkMode = true,
}: HeaderProps) {
  if (variant === 'franchisor') {
    return (
      <Suspense fallback={<FranchisorHeaderFallback />}>
        <HeaderContent variant="franchisor" darkMode={darkMode} />
      </Suspense>
    )
  }
  return <HeaderContent variant={variant} darkMode={darkMode} />
}
