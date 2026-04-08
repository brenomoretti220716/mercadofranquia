'use client'

import Header from '@/src/components/header/Header'
import Favorites from '@/src/components/franchisees/franchises/favorites/Favorites'
import FakeFavoritesList from '@/src/components/franchisees/franchises/favorites/FakeFavoritesList'
import ModalIncompleteProfile from '@/src/components/ui/ModalIncompleteProfile'
import ModalRedirectLogin from '@/src/components/ui/ModalRedirectLogin'
import { isMember, useAuth } from '@/src/hooks/users/useAuth'
import RankingTableSkeleton from '@/src/components/ui/skeletons/RankingTableSkeleton'
import { Suspense, useEffect, useMemo, useState } from 'react'

export default function FavoritesPage() {
  const { isAuthenticated, token, isValidating, payload } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)

  const isIncompleteUser = useMemo(() => {
    if (!payload) return false
    if (!payload.role) return true
    return isMember(payload)
  }, [payload])

  useEffect(() => {
    if (isValidating) return

    if (!isAuthenticated || !token) {
      setShowLoginModal(true)
      setShowProfileModal(false)
      return
    }

    if (isIncompleteUser) {
      setShowProfileModal(true)
      setShowLoginModal(false)
      return
    }

    setShowLoginModal(false)
    setShowProfileModal(false)
  }, [isAuthenticated, isValidating, isIncompleteUser, token])

  if (isValidating) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          <div className="m-5 md:m-10">
            <RankingTableSkeleton />
          </div>
        </main>
      </div>
    )
  }

  if (!isAuthenticated || !token || isIncompleteUser) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          <div className="m-5 md:m-10 relative">
            <FakeFavoritesList />
            {/* Unauthenticated users → redirect to login */}
            <ModalRedirectLogin
              isOpen={showLoginModal}
              onClose={() => setShowLoginModal(false)}
              message="Para acessar seus favoritos, você precisa estar logado."
              closable={false}
              excludeTopHeight={64}
            />
            {/* Logged-in but incomplete profile → redirect to perfil */}
            <ModalIncompleteProfile
              isOpen={showProfileModal}
              onClose={() => setShowProfileModal(false)}
            />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="m-5 md:m-10">
          <Suspense fallback={<RankingTableSkeleton />}>
            <Favorites token={token} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
