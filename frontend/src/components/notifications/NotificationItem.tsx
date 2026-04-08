'use client'

import { Notification } from '@/src/schemas/notifications/Notification'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import TrashIcon from '@/src/components/icons/trashIcon'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  isDeleting?: boolean
}

const notificationTypeIcons: Record<string, string> = {
  MEMBER_REGISTRATION: '👤',
  FRANCHISOR_REQUEST: '📋',
  REQUEST_APPROVED: '✅',
  REQUEST_REJECTED: '❌',
  SYSTEM: '🔔',
}

export default function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  isDeleting = false,
}: NotificationItemProps) {
  const icon = notificationTypeIcons[notification.type] || '🔔'

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: ptBR,
  })

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete(notification.id)
  }

  const content = (
    <div
      className={`
        relative p-3 rounded-lg border transition-all cursor-pointer
        hover:bg-gray-50
        ${
          notification.isRead
            ? 'bg-white border-gray-200'
            : 'bg-orange-50 border-orange-200'
        }
        ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
      `}
      onClick={handleClick}
    >
      {/* Unread indicator dot */}
      {!notification.isRead && (
        <div className="absolute top-3 right-3 w-2 h-2 bg-[#E25E3E] rounded-full" />
      )}

      <div className="flex gap-2">
        {/* Icon */}
        <div className="flex-shrink-0 text-lg">{icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-gray-900 mb-0.5">
            {notification.title}
          </h4>
          <p className="text-xs text-gray-600 mb-1 line-clamp-2">
            {notification.message}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{timeAgo}</span>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
              title="Remover notificação"
            >
              <TrashIcon width={14} height={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  if (notification.link) {
    return (
      <Link href={notification.link} className="block">
        {content}
      </Link>
    )
  }

  return content
}
