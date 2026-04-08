'use client'

import { ReactNode } from 'react'

interface NewsListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  className?: string
  emptyState?: ReactNode
}

export function NewsList<T>({
  items,
  renderItem,
  className,
  emptyState = null,
}: NewsListProps<T>) {
  if (items.length === 0) {
    return <>{emptyState}</>
  }

  return <div className={className}>{items.map(renderItem)}</div>
}

export default NewsList
