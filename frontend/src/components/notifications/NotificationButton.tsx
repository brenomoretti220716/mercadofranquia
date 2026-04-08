'use client'

import BellIcon from '@/src/components/icons/bellIcon'
import { useNotificationsContext } from '@/src/contexts/NotificationsContext'
import { useEffect, useRef } from 'react'
import NotificationBadge from './NotificationBadge'
import NotificationPanel from './NotificationPanel'

interface NotificationButtonProps {
  className?: string
  iconColor?: string
  iconSize?: number
}

export default function NotificationButton({
  className = '',
  iconColor = 'white',
  iconSize = 24,
}: NotificationButtonProps) {
  const { unreadCount, togglePanel, isLoadingStats, closePanel, isPanelOpen } =
    useNotificationsContext()

  const dropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        closePanel()
      }
    }

    if (isPanelOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isPanelOpen, closePanel])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={isPanelOpen ? closePanel : togglePanel}
        className={`
          relative p-2 rounded-lg transition-colors
          hover:bg-secondary
          ${className}
        `}
        aria-label="Notificações"
        title="Notificações"
      >
        <BellIcon size={iconSize} color={iconColor} />
        {!isLoadingStats && <NotificationBadge count={unreadCount} />}
      </button>

      {/* Dropdown Panel */}
      <NotificationPanel />
    </div>
  )
}
