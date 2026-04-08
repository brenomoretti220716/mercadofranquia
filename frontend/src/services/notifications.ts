import Api from '@/src/api/Api'
import type {
  NotificationsResponse,
  NotificationStats,
  MarkAsReadRequest,
} from '@/src/schemas/notifications/Notification'

export interface FetchNotificationsParams {
  page?: number
  limit?: number
  unreadOnly?: boolean
  token: string
}

export async function fetchNotifications(
  params: FetchNotificationsParams,
): Promise<NotificationsResponse> {
  const { page = 1, limit = 10, unreadOnly = false, token } = params

  const searchParams = new URLSearchParams()
  searchParams.set('page', String(page))
  searchParams.set('limit', String(limit))
  if (unreadOnly) searchParams.set('unreadOnly', 'true')

  const response = await fetch(
    Api(`/notifications?${searchParams.toString()}`),
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.status}`)
  }

  return await response.json()
}

export async function fetchNotificationStats(
  token: string,
): Promise<NotificationStats> {
  const response = await fetch(Api('/notifications/stats'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch notification stats: ${response.status}`)
  }

  return await response.json()
}

export async function markNotificationsAsRead(
  token: string,
  data: MarkAsReadRequest,
): Promise<{ count: number }> {
  const response = await fetch(Api('/notifications/mark-read'), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: 'Erro ao marcar notificações como lidas',
    }))
    throw new Error(
      errorData.message || 'Erro ao marcar notificações como lidas',
    )
  }

  return await response.json()
}

export async function markAllNotificationsAsRead(
  token: string,
): Promise<{ count: number }> {
  const response = await fetch(Api('/notifications/mark-all-read'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: 'Erro ao marcar todas as notificações como lidas',
    }))
    throw new Error(
      errorData.message || 'Erro ao marcar todas as notificações como lidas',
    )
  }

  return await response.json()
}

export async function deleteNotification(
  token: string,
  notificationId: string,
): Promise<void> {
  const response = await fetch(Api(`/notifications/${notificationId}`), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: 'Erro ao deletar notificação',
    }))
    throw new Error(errorData.message || 'Erro ao deletar notificação')
  }
}
