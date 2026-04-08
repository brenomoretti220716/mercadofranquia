'use client'

import Header from '@/src/components/header/Header'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <Header variant="admin" />
      {children}
    </div>
  )
}
