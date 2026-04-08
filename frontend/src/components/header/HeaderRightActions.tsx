'use client'

import { Payload } from '@/src/schemas/auth/auth'
import Link from 'next/link'
import { AdminDesktopActions } from './admin/AdminDesktopActions'
import { FranchisorDesktopActions } from './franchisor/FranchisorDesktopActions'
import { MinimalDesktopNav } from './public/MinimalDesktopNav'
import { RenderDesktopLayout } from './shared/RenderDesktopLayout'

export type HeaderVariant = 'public' | 'admin' | 'franchisor' | 'minimal'

type HeaderRightActionsProps =
  | { variant: 'minimal'; darkMode?: boolean }
  | {
      payload: Payload
      variant: 'public'
      darkMode?: boolean
      isAuthenticated: boolean
      dropdownRef: React.RefObject<HTMLDivElement | null>
      isDropdownOpen: boolean
      onDropdownToggle: () => void
    }
  | {
      payload: Payload
      variant: 'admin'
      darkMode?: boolean
      profileDropdownRef: React.RefObject<HTMLDivElement | null>
      isProfileDropdown: boolean
      setIsProfileDropdown: React.Dispatch<React.SetStateAction<boolean>>
    }
  | {
      payload: Payload
      variant: 'franchisor'
      darkMode?: boolean
      profileDropdownRef: React.RefObject<HTMLDivElement | null>
      isProfileDropdown: boolean
      setIsProfileDropdown: React.Dispatch<React.SetStateAction<boolean>>
    }

/**
 * Optional right-side block (login/cadastrar, user menu, etc.).
 */
export function HeaderRightActions(props: HeaderRightActionsProps) {
  if (props.variant === 'minimal') {
    return <MinimalDesktopNav darkMode={props.darkMode} />
  }

  if (props.variant === 'public') {
    const isLoggedIn = props.isAuthenticated
    const textColor = props.darkMode ? 'text-white' : 'text-[#171726]'
    return (
      <div className="hidden md:flex items-center gap-4">
        {!isLoggedIn && (
          <>
            <Link href="/login">
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${textColor} hover:text-primary cursor-pointer`}
              >
                Login
              </button>
            </Link>
            <Link href="/cadastro">
              <button className="bg-primary hover:bg-coral-dark text-white rounded-md px-5 py-2 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer">
                Cadastrar Franquia
              </button>
            </Link>
          </>
        )}
        {isLoggedIn && (
          <RenderDesktopLayout
            dropdownRef={props.dropdownRef}
            handleDropdownToggle={props.onDropdownToggle}
            isDropdownOpen={props.isDropdownOpen}
          />
        )}
      </div>
    )
  }

  if (props.variant === 'admin') {
    return (
      <AdminDesktopActions
        profileDropdownRef={props.profileDropdownRef}
        isProfileDropdown={props.isProfileDropdown}
        setIsProfileDropdown={props.setIsProfileDropdown}
      />
    )
  }

  if (props.variant === 'franchisor') {
    return (
      <FranchisorDesktopActions
        profileDropdownRef={props.profileDropdownRef}
        isProfileDropdown={props.isProfileDropdown}
        setIsProfileDropdown={props.setIsProfileDropdown}
        darkMode={props.darkMode}
      />
    )
  }

  return null
}
