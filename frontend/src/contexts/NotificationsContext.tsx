'use client'

import {
  useDeleteNotification,
  useMarkAllAsRead,
  useMarkAsRead,
} from '@/src/hooks/notifications/useNotificationMutations'
import {
  useNotifications,
  useNotificationStats,
} from '@/src/hooks/notifications/useNotifications'
import { useAuth } from '@/src/hooks/users/useAuth'
import type { Notification } from '@/src/schemas/notifications/Notification'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react'

interface NotificationsContextType {
  // Data
  notifications: Notification[]
  unreadCount: number
  total: number
  page: number
  lastPage: number

  // Loading states
  isLoading: boolean
  isLoadingStats: boolean

  // Pagination
  currentPage: number
  setCurrentPage: (page: number) => void

  // Filter
  showUnreadOnly: boolean
  toggleUnreadOnly: () => void

  // Panel state
  isPanelOpen: boolean
  openPanel: () => void
  closePanel: () => void
  togglePanel: () => void

  // Actions
  markAsRead: (notificationIds: string[]) => void
  markAllAsRead: () => void
  deleteNotification: (notificationId: string) => void

  // Loading states for mutations
  isMarkingAsRead: boolean
  isMarkingAllAsRead: boolean
  isDeletingNotification: boolean
}

const NotificationsContext = createContext<NotificationsContextType>(
  {} as NotificationsContextType,
)

interface NotificationsProviderProps {
  children: ReactNode
}

export function NotificationsProvider({
  children,
}: NotificationsProviderProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  const { token } = useAuth()

  // Queries
  const { data: notificationsData, isLoading } = useNotifications({
    page: currentPage,
    limit: 10,
    unreadOnly: showUnreadOnly,
    token,
    enabled: !!token,
  })

  const { data: statsData, isLoading: isLoadingStats } = useNotificationStats(
    token,
    !!token,
  )

  // Mutations
  const markAsReadMutation = useMarkAsRead(token)
  const markAllAsReadMutation = useMarkAllAsRead(token)
  const deleteNotificationMutation = useDeleteNotification(token)

  // Actions
  const markAsRead = useCallback(
    (notificationIds: string[]) => {
      markAsReadMutation.mutate(notificationIds)
    },
    [markAsReadMutation],
  )

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate()
  }, [markAllAsReadMutation])

  const deleteNotification = useCallback(
    (notificationId: string) => {
      deleteNotificationMutation.mutate(notificationId)
    },
    [deleteNotificationMutation],
  )

  const toggleUnreadOnly = useCallback(() => {
    setShowUnreadOnly((prev) => !prev)
    setCurrentPage(1) // Reset to first page when toggling filter
  }, [])

  const openPanel = useCallback(() => setIsPanelOpen(true), [])
  const closePanel = useCallback(() => setIsPanelOpen(false), [])
  const togglePanel = useCallback(() => setIsPanelOpen((prev) => !prev), [])

  const value: NotificationsContextType = {
    // Data
    notifications: notificationsData?.data || [],
    unreadCount: statsData?.unread || 0,
    total: notificationsData?.total || 0,
    page: notificationsData?.page || 1,
    lastPage: notificationsData?.lastPage || 1,

    // Loading states
    isLoading,
    isLoadingStats,

    // Pagination
    currentPage,
    setCurrentPage,

    // Filter
    showUnreadOnly,
    toggleUnreadOnly,

    // Panel state
    isPanelOpen,
    openPanel,
    closePanel,
    togglePanel,

    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,

    // Mutation loading states
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeletingNotification: deleteNotificationMutation.isPending,
  }

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotificationsContext() {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error(
      'useNotificationsContext must be used within NotificationsProvider',
    )
  }
  return context
}
