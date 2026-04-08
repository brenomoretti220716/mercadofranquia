import { queryOptions } from '@tanstack/react-query'
import {
  fetchNotifications,
  fetchNotificationStats,
  type FetchNotificationsParams,
} from '@/src/services/notifications'

export type { FetchNotificationsParams } from '@/src/services/notifications'

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (params: FetchNotificationsParams) =>
    [...notificationKeys.lists(), params] as const,
  stats: (token: string) => [...notificationKeys.all, 'stats', token] as const,
}

export const notificationQueries = {
  list: (params: FetchNotificationsParams) =>
    queryOptions({
      queryKey: notificationKeys.list(params),
      queryFn: () => fetchNotifications(params),
      staleTime: 1000 * 30, // 30 seconds - notifications should be fresh
      refetchInterval: 1000 * 60, // Refetch every minute
    }),

  stats: (token: string) =>
    queryOptions({
      queryKey: notificationKeys.stats(token),
      queryFn: () => fetchNotificationStats(token),
      staleTime: 1000 * 30, // 30 seconds
      refetchInterval: 1000 * 60, // Refetch every minute
    }),
}
