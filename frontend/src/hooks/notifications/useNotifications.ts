'use client'

import { useQuery } from '@tanstack/react-query'
import { notificationQueries } from '@/src/queries/notifications'

interface UseNotificationsParams {
  page?: number
  limit?: number
  unreadOnly?: boolean
  token: string | null
  enabled?: boolean
}

export function useNotifications({
  page = 1,
  limit = 10,
  unreadOnly = false,
  token,
  enabled = true,
}: UseNotificationsParams) {
  return useQuery({
    ...notificationQueries.list({
      page,
      limit,
      unreadOnly,
      token: token || '',
    }),
    enabled: enabled && !!token,
  })
}

export function useNotificationStats(token: string | null, enabled = true) {
  return useQuery({
    ...notificationQueries.stats(token || ''),
    enabled: enabled && !!token,
  })
}
