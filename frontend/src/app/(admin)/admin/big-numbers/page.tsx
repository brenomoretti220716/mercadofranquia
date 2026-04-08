'use client'

import AdminBigNumbersPanel from '@/src/components/admin/panels/franchises/AdminBigNumbersPanel'
import AdminSponsoredPanelSkeleton from '@/src/components/ui/skeletons/AdminSponsoredPanelSkeleton'
import { Suspense } from 'react'

export default function AdminBigNumbersPage() {
  return (
    <Suspense fallback={<AdminSponsoredPanelSkeleton />}>
      <AdminBigNumbersPanel />
    </Suspense>
  )
}
