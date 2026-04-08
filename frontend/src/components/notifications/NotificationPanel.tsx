'use client'

import { useNotificationsContext } from '@/src/contexts/NotificationsContext'
import { useEffect } from 'react'
import NotificationItem from './NotificationItem'

export default function NotificationPanel() {
  const {
    notifications,
    unreadCount,
    isLoading,
    isPanelOpen,
    closePanel,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    showUnreadOnly,
    toggleUnreadOnly,
    currentPage,
    setCurrentPage,
    lastPage,
    isMarkingAllAsRead,
    isDeletingNotification,
  } = useNotificationsContext()

  // Close dropdown on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPanelOpen) {
        closePanel()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isPanelOpen, closePanel])

  if (!isPanelOpen) return null

  return (
    <div className="absolute top-full right-0 mt-2 w-96 max-h-[600px] bg-white rounded-lg shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-gray-900">
            Notificações
          </h2>
          {unreadCount > 0 && (
            <span className="text-xs text-gray-500">
              {unreadCount} {unreadCount === 1 ? 'nova' : 'novas'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={isMarkingAllAsRead}
              className="text-xs text-[#E25E3E] hover:text-[#c24d2f] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMarkingAllAsRead ? 'Marcando...' : 'Marcar todas como lidas'}
            </button>
          )}

          <button
            onClick={toggleUnreadOnly}
            className={`
              text-xs px-2 py-1 rounded transition-colors
              ${
                showUnreadOnly
                  ? 'bg-[#E25E3E] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }
            `}
          >
            {showUnreadOnly ? 'Todas' : 'Não lidas'}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto max-h-[400px] p-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E25E3E]" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <p className="text-2xl mb-1">📭</p>
            <p className="text-sm">
              {showUnreadOnly
                ? 'Nenhuma notificação não lida'
                : 'Nenhuma notificação'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.slice(0, 5).map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={(id) => markAsRead([id])}
                onDelete={deleteNotification}
                isDeleting={isDeletingNotification}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer with pagination or view all */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          {lastPage > 1 ? (
            <div className="flex items-center justify-between text-xs">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>

              <span className="text-gray-600">
                Página {currentPage} de {lastPage}
              </span>

              <button
                onClick={() =>
                  setCurrentPage(Math.min(lastPage, currentPage + 1))
                }
                disabled={currentPage === lastPage}
                className="px-3 py-1.5 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          ) : (
            <button
              onClick={closePanel}
              className="w-full text-center text-xs text-[#E25E3E] hover:text-[#c24d2f] font-medium"
            >
              Fechar
            </button>
          )}
        </div>
      )}
    </div>
  )
}
