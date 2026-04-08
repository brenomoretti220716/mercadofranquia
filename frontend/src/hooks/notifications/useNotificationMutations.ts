'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  markNotificationsAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/src/services/notifications'
import { notificationKeys } from '@/src/queries/notifications'
import { toast } from 'sonner'
import { formatErrorMessage } from '@/src/utils/errorHandlers'

export function useMarkAsRead(token: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationIds: string[]) => {
      if (!token) throw new Error('Token não encontrado')
      return markNotificationsAsRead(token, { notificationIds })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
    onError: (error: Error) => {
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível marcar as notificações como lidas. Tente novamente.',
        ),
      )
    },
  })
}

export function useMarkAllAsRead(token: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => {
      if (!token) throw new Error('Token não encontrado')
      return markAllNotificationsAsRead(token)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      if (data.count > 0) {
        toast.success(`${data.count} notificações marcadas como lidas`)
      }
    },
    onError: (error: Error) => {
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível marcar todas as notificações como lidas. Tente novamente.',
        ),
      )
    },
  })
}

export function useDeleteNotification(token: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => {
      if (!token) throw new Error('Token não encontrado')
      return deleteNotification(token, notificationId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      toast.success('Notificação removida')
    },
    onError: (error: Error) => {
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível remover a notificação. Tente novamente.',
        ),
      )
    },
  })
}
